import { ApplicationException } from '@api/core/http/exceptions/application.exception';
import { CampaignAlreadySentError } from '@api/modules/newsletter/domain/errors/campaign-already-sent.error';
import { CampaignAudienceEmptyError } from '@api/modules/newsletter/domain/errors/campaign-audience-empty.error';
import { CampaignContentInvalidError } from '@api/modules/newsletter/domain/errors/campaign-content-invalid.error';
import { CampaignPostNotPublishedError } from '@api/modules/newsletter/domain/errors/campaign-post-not-published.error';
import { CampaignSendInProgressError } from '@api/modules/newsletter/domain/errors/campaign-send-in-progress.error';
import { CampaignStateInconsistentError } from '@api/modules/newsletter/domain/errors/campaign-state-inconsistent.error';
import { InvalidCampaignStatusTransitionError } from '@api/modules/newsletter/domain/errors/invalid-campaign-status-transition.error';
import { HttpStatus } from '@nestjs/common';

function exception(error: Error & { code: string }, message: string, statusCode: HttpStatus) {
  return new ApplicationException({ cause: error, code: error.code, message, statusCode });
}

export function throwCampaignDomainException(error: unknown): never {
  if (error instanceof CampaignContentInvalidError) {
    throw exception(error, 'O conteúdo da campanha é inválido.', HttpStatus.UNPROCESSABLE_ENTITY);
  }
  if (error instanceof CampaignAudienceEmptyError) {
    throw exception(error, 'Não há assinantes elegíveis para a campanha.', HttpStatus.CONFLICT);
  }
  if (error instanceof CampaignPostNotPublishedError) {
    throw exception(error, 'A campanha exige um post publicado.', HttpStatus.CONFLICT);
  }
  if (error instanceof CampaignAlreadySentError) {
    throw exception(error, 'A campanha já foi enviada.', HttpStatus.CONFLICT);
  }
  if (error instanceof CampaignSendInProgressError) {
    throw exception(error, 'O envio da campanha já está em andamento.', HttpStatus.CONFLICT);
  }
  if (
    error instanceof InvalidCampaignStatusTransitionError ||
    error instanceof CampaignStateInconsistentError
  ) {
    throw exception(
      error,
      'O estado atual da campanha não permite esta ação.',
      HttpStatus.CONFLICT,
    );
  }
  throw error;
}
