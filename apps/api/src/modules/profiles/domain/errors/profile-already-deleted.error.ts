export class ProfileAlreadyDeletedError extends Error {
  constructor() {
    super('Deleted profiles cannot be changed.');
    this.name = ProfileAlreadyDeletedError.name;
  }
}
