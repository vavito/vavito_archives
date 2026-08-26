import { CampaignStatus } from '@api/modules/newsletter/domain/enums/campaign-status.enum';
import { CampaignAlreadySentError } from '@api/modules/newsletter/domain/errors/campaign-already-sent.error';
import { CampaignAudienceEmptyError } from '@api/modules/newsletter/domain/errors/campaign-audience-empty.error';
import { CampaignContentInvalidError } from '@api/modules/newsletter/domain/errors/campaign-content-invalid.error';
import { CampaignSendInProgressError } from '@api/modules/newsletter/domain/errors/campaign-send-in-progress.error';
import { CampaignStateInconsistentError } from '@api/modules/newsletter/domain/errors/campaign-state-inconsistent.error';
import { InvalidCampaignStatusTransitionError } from '@api/modules/newsletter/domain/errors/invalid-campaign-status-transition.error';

export interface CampaignPostSnapshot extends Record<string, unknown> {
  excerpt: string;
  id: string;
  publishedAt: string;
  readingTimeMinutes: number;
  slug: string;
  title: string;
}

export interface CreateEmailCampaignProps {
  createdById: string;
  htmlSnapshot: string;
  id: string;
  now: Date;
  postId: string;
  postSnapshot: CampaignPostSnapshot;
  previewText: string;
  subject: string;
}

export interface RestoreEmailCampaignProps extends Omit<CreateEmailCampaignProps, 'now'> {
  audienceCount: number;
  createdAt: Date;
  failureReason: string | null;
  idempotencyKey: string | null;
  resendId: string | null;
  sendStartedAt: Date | null;
  sentAt: Date | null;
  status: CampaignStatus;
  updatedAt: Date;
}

export interface StartCampaignSendingProps {
  audienceCount: number;
  idempotencyKey: string;
  now: Date;
}

function cloneDate(date: Date): Date {
  return new Date(date.getTime());
}

function cloneNullableDate(date: Date | null): Date | null {
  return date ? cloneDate(date) : null;
}

function validDate(date: Date): boolean {
  return Number.isFinite(date.getTime());
}

export class EmailCampaign {
  private constructor(private readonly props: RestoreEmailCampaignProps) {}

  static create(props: CreateEmailCampaignProps): EmailCampaign {
    const content = this.validateContent(props.subject, props.previewText, props.htmlSnapshot);

    return new EmailCampaign({
      ...props,
      ...content,
      audienceCount: 0,
      createdAt: cloneDate(props.now),
      failureReason: null,
      idempotencyKey: null,
      postSnapshot: structuredClone(props.postSnapshot),
      resendId: null,
      sendStartedAt: null,
      sentAt: null,
      status: CampaignStatus.DRAFT,
      updatedAt: cloneDate(props.now),
    });
  }

  static restore(props: RestoreEmailCampaignProps): EmailCampaign {
    const campaign = new EmailCampaign({
      ...props,
      createdAt: cloneDate(props.createdAt),
      postSnapshot: structuredClone(props.postSnapshot),
      sendStartedAt: cloneNullableDate(props.sendStartedAt),
      sentAt: cloneNullableDate(props.sentAt),
      updatedAt: cloneDate(props.updatedAt),
    });

    campaign.ensureStateIsConsistent();
    return campaign;
  }

  get audienceCount(): number {
    return this.props.audienceCount;
  }

  get createdAt(): Date {
    return cloneDate(this.props.createdAt);
  }

  get createdById(): string {
    return this.props.createdById;
  }

  get failureReason(): string | null {
    return this.props.failureReason;
  }

  get htmlSnapshot(): string {
    return this.props.htmlSnapshot;
  }

  get id(): string {
    return this.props.id;
  }

  get idempotencyKey(): string | null {
    return this.props.idempotencyKey;
  }

  get postId(): string {
    return this.props.postId;
  }

  get postSnapshot(): CampaignPostSnapshot {
    return structuredClone(this.props.postSnapshot);
  }

  get previewText(): string {
    return this.props.previewText;
  }

  get resendId(): string | null {
    return this.props.resendId;
  }

  get sendStartedAt(): Date | null {
    return cloneNullableDate(this.props.sendStartedAt);
  }

  get sentAt(): Date | null {
    return cloneNullableDate(this.props.sentAt);
  }

  get status(): CampaignStatus {
    return this.props.status;
  }

  get subject(): string {
    return this.props.subject;
  }

  get updatedAt(): Date {
    return cloneDate(this.props.updatedAt);
  }

  updateContent(props: {
    htmlSnapshot?: string;
    now: Date;
    previewText?: string;
    subject?: string;
  }): void {
    this.ensureStatus('update content', CampaignStatus.DRAFT);
    this.ensureTransitionDate(props.now);
    const content = EmailCampaign.validateContent(
      props.subject ?? this.props.subject,
      props.previewText ?? this.props.previewText,
      props.htmlSnapshot ?? this.props.htmlSnapshot,
    );

    this.props.subject = content.subject;
    this.props.previewText = content.previewText;
    this.props.htmlSnapshot = content.htmlSnapshot;
    this.props.updatedAt = cloneDate(props.now);
  }

  startSending(props: StartCampaignSendingProps): void {
    if (this.props.status === CampaignStatus.SENT) throw new CampaignAlreadySentError();
    if (this.props.status === CampaignStatus.SENDING) throw new CampaignSendInProgressError();
    this.ensureStatus('start sending', CampaignStatus.DRAFT);
    this.ensureTransitionDate(props.now);
    if (!Number.isInteger(props.audienceCount) || props.audienceCount <= 0) {
      throw new CampaignAudienceEmptyError();
    }

    this.props.audienceCount = props.audienceCount;
    this.props.failureReason = null;
    this.props.idempotencyKey = props.idempotencyKey;
    this.props.sendStartedAt = cloneDate(props.now);
    this.props.status = CampaignStatus.SENDING;
    this.props.updatedAt = cloneDate(props.now);
  }

  markSent(resendId: string, now: Date): void {
    this.ensureStatus('mark as sent', CampaignStatus.SENDING);
    this.ensureTransitionDate(now);
    if (resendId.trim().length === 0) throw new CampaignStateInconsistentError();

    this.props.resendId = resendId;
    this.props.sentAt = cloneDate(now);
    this.props.status = CampaignStatus.SENT;
    this.props.updatedAt = cloneDate(now);
  }

  markFailed(reason: string, now: Date): void {
    this.ensureStatus('mark as failed', CampaignStatus.SENDING);
    this.ensureTransitionDate(now);
    const sanitizedReason = reason.trim();
    if (sanitizedReason.length === 0) throw new CampaignStateInconsistentError();

    this.props.failureReason = sanitizedReason;
    this.props.status = CampaignStatus.FAILED;
    this.props.updatedAt = cloneDate(now);
  }

  private static validateContent(subject: string, previewText: string, htmlSnapshot: string) {
    const normalizedSubject = subject.trim();
    const normalizedPreview = previewText.trim();
    const normalizedHtml = htmlSnapshot.trim();

    if (
      normalizedSubject.length === 0 ||
      normalizedSubject.length > 255 ||
      normalizedPreview.length > 255 ||
      normalizedHtml.length === 0
    ) {
      throw new CampaignContentInvalidError();
    }

    return {
      htmlSnapshot: normalizedHtml,
      previewText: normalizedPreview,
      subject: normalizedSubject,
    };
  }

  private ensureStatus(action: string, expected: CampaignStatus): void {
    if (this.props.status !== expected) {
      throw new InvalidCampaignStatusTransitionError(action, this.props.status);
    }
  }

  private ensureStateIsConsistent(): void {
    EmailCampaign.validateContent(
      this.props.subject,
      this.props.previewText,
      this.props.htmlSnapshot,
    );
    const datesAreValid =
      validDate(this.props.createdAt) &&
      validDate(this.props.updatedAt) &&
      (!this.props.sendStartedAt || validDate(this.props.sendStartedAt)) &&
      (!this.props.sentAt || validDate(this.props.sentAt)) &&
      this.props.updatedAt >= this.props.createdAt &&
      (!this.props.sendStartedAt ||
        (this.props.sendStartedAt >= this.props.createdAt &&
          this.props.sendStartedAt <= this.props.updatedAt)) &&
      (!this.props.sentAt ||
        (this.props.sendStartedAt !== null &&
          this.props.sentAt >= this.props.sendStartedAt &&
          this.props.sentAt <= this.props.updatedAt));
    const draftIsValid =
      this.props.status !== CampaignStatus.DRAFT ||
      (this.props.audienceCount === 0 &&
        this.props.idempotencyKey === null &&
        this.props.resendId === null &&
        this.props.failureReason === null &&
        this.props.sendStartedAt === null &&
        this.props.sentAt === null);
    const sendingIsValid =
      this.props.status !== CampaignStatus.SENDING ||
      (this.hasSendContext() &&
        this.props.resendId === null &&
        this.props.failureReason === null &&
        this.props.sentAt === null);
    const sentIsValid =
      this.props.status !== CampaignStatus.SENT ||
      (this.hasSendContext() &&
        Boolean(this.props.resendId) &&
        this.props.failureReason === null &&
        this.props.sentAt !== null);
    const failedIsValid =
      this.props.status !== CampaignStatus.FAILED ||
      (this.hasSendContext() &&
        this.props.resendId === null &&
        Boolean(this.props.failureReason) &&
        this.props.sentAt === null);

    if (!datesAreValid || !draftIsValid || !sendingIsValid || !sentIsValid || !failedIsValid) {
      throw new CampaignStateInconsistentError();
    }
  }

  private hasSendContext(): boolean {
    return (
      this.props.audienceCount > 0 &&
      this.props.idempotencyKey !== null &&
      this.props.sendStartedAt !== null
    );
  }

  private ensureTransitionDate(now: Date): void {
    if (!validDate(now) || now < this.props.updatedAt) {
      throw new CampaignStateInconsistentError();
    }
  }
}
