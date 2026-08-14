export class InvalidProfileDisplayNameError extends Error {
  constructor() {
    super('Profile display name must contain between 1 and 120 characters.');
    this.name = InvalidProfileDisplayNameError.name;
  }
}
