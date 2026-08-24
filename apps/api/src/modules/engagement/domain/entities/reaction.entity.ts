import type { ReactionType } from '@api/modules/engagement/domain/enums/reaction-type.enum';

export interface CreateReactionProps {
  id: string;
  now: Date;
  postId: string;
  profileId: string;
  type: ReactionType;
}

export interface RestoreReactionProps {
  createdAt: Date;
  id: string;
  postId: string;
  profileId: string;
  type: ReactionType;
  updatedAt: Date;
}

function cloneDate(date: Date): Date {
  return new Date(date.getTime());
}

export class Reaction {
  private constructor(private readonly props: RestoreReactionProps) {}

  static create(props: CreateReactionProps): Reaction {
    return new Reaction({
      createdAt: cloneDate(props.now),
      id: props.id,
      postId: props.postId,
      profileId: props.profileId,
      type: props.type,
      updatedAt: cloneDate(props.now),
    });
  }

  static restore(props: RestoreReactionProps): Reaction {
    return new Reaction({
      ...props,
      createdAt: cloneDate(props.createdAt),
      updatedAt: cloneDate(props.updatedAt),
    });
  }

  get createdAt(): Date {
    return cloneDate(this.props.createdAt);
  }

  get id(): string {
    return this.props.id;
  }

  get postId(): string {
    return this.props.postId;
  }

  get profileId(): string {
    return this.props.profileId;
  }

  get type(): ReactionType {
    return this.props.type;
  }

  get updatedAt(): Date {
    return cloneDate(this.props.updatedAt);
  }

  changeType(type: ReactionType, now: Date): boolean {
    if (this.props.type === type) {
      return false;
    }

    this.props.type = type;
    this.props.updatedAt = cloneDate(now);
    return true;
  }
}
