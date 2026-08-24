export interface CreateBookmarkProps {
  id: string;
  now: Date;
  postId: string;
  profileId: string;
}

export interface RestoreBookmarkProps {
  createdAt: Date;
  id: string;
  postId: string;
  profileId: string;
}

function cloneDate(date: Date): Date {
  return new Date(date.getTime());
}

export class Bookmark {
  private constructor(private readonly props: RestoreBookmarkProps) {}

  static create(props: CreateBookmarkProps): Bookmark {
    return new Bookmark({
      createdAt: cloneDate(props.now),
      id: props.id,
      postId: props.postId,
      profileId: props.profileId,
    });
  }

  static restore(props: RestoreBookmarkProps): Bookmark {
    return new Bookmark({ ...props, createdAt: cloneDate(props.createdAt) });
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
}
