import {
  CONTACT_DEFAULT_SUBJECT,
  MAX_CONTACT_EMAIL_LENGTH,
  MAX_CONTACT_MESSAGE_LENGTH,
  MAX_CONTACT_NAME_LENGTH,
  MAX_CONTACT_SUBJECT_LENGTH,
  MIN_CONTACT_MESSAGE_LENGTH,
  MIN_CONTACT_NAME_LENGTH,
} from '@api/modules/contact/contact.constants';
import { ContactMessageStatus } from '@api/modules/contact/domain/enums/contact-message-status.enum';
import { ContactMessageContentInvalidError } from '@api/modules/contact/domain/errors/contact-message-content-invalid.error';
import { ContactMessageStateInconsistentError } from '@api/modules/contact/domain/errors/contact-message-state-inconsistent.error';
import { InvalidContactMessageStatusTransitionError } from '@api/modules/contact/domain/errors/invalid-contact-message-status-transition.error';

export interface CreateContactMessageProps {
  email: string;
  id: string;
  message: string;
  name: string;
  now: Date;
  subject?: string;
}

export interface RestoreContactMessageProps {
  archivedAt: Date | null;
  createdAt: Date;
  email: string;
  id: string;
  message: string;
  name: string;
  readAt: Date | null;
  status: ContactMessageStatus;
  subject: string;
  updatedAt: Date;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function cloneDate(date: Date): Date {
  return new Date(date.getTime());
}

function cloneNullableDate(date: Date | null): Date | null {
  return date ? cloneDate(date) : null;
}

function validDate(date: Date): boolean {
  return Number.isFinite(date.getTime());
}

function normalizeInlineText(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function hasForbiddenControlCharacter(value: string): boolean {
  return Array.from(value).some((character) => {
    const code = character.charCodeAt(0);
    return code === 127 || (code < 32 && code !== 9 && code !== 10 && code !== 13);
  });
}

export class ContactMessage {
  private constructor(private readonly props: RestoreContactMessageProps) {}

  static create(props: CreateContactMessageProps): ContactMessage {
    const name = normalizeInlineText(props.name);
    const email = props.email.trim().toLowerCase();
    const subject = normalizeInlineText(props.subject ?? '') || CONTACT_DEFAULT_SUBJECT;
    const message = props.message.trim();

    ContactMessage.ensureContentIsValid({ email, message, name, subject });
    if (!validDate(props.now)) throw new ContactMessageStateInconsistentError();

    return new ContactMessage({
      archivedAt: null,
      createdAt: cloneDate(props.now),
      email,
      id: props.id,
      message,
      name,
      readAt: null,
      status: ContactMessageStatus.RECEIVED,
      subject,
      updatedAt: cloneDate(props.now),
    });
  }

  static restore(props: RestoreContactMessageProps): ContactMessage {
    ContactMessage.ensureContentIsValid(props);
    const contactMessage = new ContactMessage({
      ...props,
      archivedAt: cloneNullableDate(props.archivedAt),
      createdAt: cloneDate(props.createdAt),
      readAt: cloneNullableDate(props.readAt),
      updatedAt: cloneDate(props.updatedAt),
    });

    contactMessage.ensureStateIsConsistent();
    return contactMessage;
  }

  get archivedAt(): Date | null {
    return cloneNullableDate(this.props.archivedAt);
  }

  get createdAt(): Date {
    return cloneDate(this.props.createdAt);
  }

  get email(): string {
    return this.props.email;
  }

  get id(): string {
    return this.props.id;
  }

  get message(): string {
    return this.props.message;
  }

  get name(): string {
    return this.props.name;
  }

  get readAt(): Date | null {
    return cloneNullableDate(this.props.readAt);
  }

  get status(): ContactMessageStatus {
    return this.props.status;
  }

  get subject(): string {
    return this.props.subject;
  }

  get updatedAt(): Date {
    return cloneDate(this.props.updatedAt);
  }

  markRead(now: Date): void {
    this.ensureStatus('mark as read', ContactMessageStatus.RECEIVED);
    this.ensureTransitionDate(now);

    this.props.readAt = cloneDate(now);
    this.props.status = ContactMessageStatus.READ;
    this.props.updatedAt = cloneDate(now);
  }

  archive(now: Date): void {
    this.ensureStatus('archive', ContactMessageStatus.READ);
    this.ensureTransitionDate(now);

    this.props.archivedAt = cloneDate(now);
    this.props.status = ContactMessageStatus.ARCHIVED;
    this.props.updatedAt = cloneDate(now);
  }

  private static ensureContentIsValid(
    fields: Pick<RestoreContactMessageProps, 'email' | 'message' | 'name' | 'subject'>,
  ): void {
    const isValid =
      fields.name.length >= MIN_CONTACT_NAME_LENGTH &&
      fields.name.length <= MAX_CONTACT_NAME_LENGTH &&
      fields.email.length <= MAX_CONTACT_EMAIL_LENGTH &&
      EMAIL_PATTERN.test(fields.email) &&
      fields.subject.length > 0 &&
      fields.subject.length <= MAX_CONTACT_SUBJECT_LENGTH &&
      fields.message.length >= MIN_CONTACT_MESSAGE_LENGTH &&
      fields.message.length <= MAX_CONTACT_MESSAGE_LENGTH &&
      !hasForbiddenControlCharacter(fields.name) &&
      !hasForbiddenControlCharacter(fields.subject) &&
      !hasForbiddenControlCharacter(fields.message);

    if (!isValid) throw new ContactMessageContentInvalidError();
  }

  private ensureStateIsConsistent(): void {
    const dates = [this.props.readAt, this.props.archivedAt].filter(
      (date): date is Date => date !== null,
    );
    const datesAreValid =
      validDate(this.props.createdAt) &&
      validDate(this.props.updatedAt) &&
      dates.every(validDate) &&
      this.props.updatedAt >= this.props.createdAt &&
      dates.every((date) => date >= this.props.createdAt && date <= this.props.updatedAt);
    const receivedIsValid =
      this.props.status !== ContactMessageStatus.RECEIVED ||
      (this.props.readAt === null && this.props.archivedAt === null);
    const readIsValid =
      this.props.status !== ContactMessageStatus.READ ||
      (this.props.readAt !== null && this.props.archivedAt === null);
    const archivedIsValid =
      this.props.status !== ContactMessageStatus.ARCHIVED ||
      (this.props.readAt !== null && this.props.archivedAt !== null);

    if (!datesAreValid || !receivedIsValid || !readIsValid || !archivedIsValid) {
      throw new ContactMessageStateInconsistentError();
    }
  }

  private ensureStatus(action: string, ...allowedStatuses: ContactMessageStatus[]): void {
    if (!allowedStatuses.includes(this.props.status)) {
      throw new InvalidContactMessageStatusTransitionError(action, this.props.status);
    }
  }

  private ensureTransitionDate(now: Date): void {
    if (!validDate(now) || now < this.props.updatedAt) {
      throw new ContactMessageStateInconsistentError();
    }
  }
}
