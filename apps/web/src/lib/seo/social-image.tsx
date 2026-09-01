import { ImageResponse } from 'next/og';

export const SOCIAL_IMAGE_ALT =
  'Vavito Archives — artigos sobre desenvolvimento, arquitetura e produto';
export const SOCIAL_IMAGE_SIZE = {
  height: 630,
  width: 1200,
};

export function createSocialPreviewImage(): ImageResponse {
  return new ImageResponse(
    <div
      style={{
        alignItems: 'stretch',
        background: '#18191b',
        color: '#f5f5f5',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'Arial, sans-serif',
        height: '100%',
        justifyContent: 'space-between',
        padding: '72px 80px',
        width: '100%',
      }}
    >
      <div
        style={{
          alignItems: 'center',
          color: '#7dd3fc',
          display: 'flex',
          fontSize: 24,
          fontWeight: 700,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
        }}
      >
        Vavito Archives
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div
          style={{
            display: 'flex',
            fontSize: 68,
            fontWeight: 700,
            letterSpacing: '-0.04em',
            lineHeight: 1.05,
            maxWidth: 980,
          }}
        >
          Ideias de quem constrói software.
        </div>
        <div
          style={{
            color: '#a3a3a3',
            display: 'flex',
            fontSize: 28,
            lineHeight: 1.4,
            maxWidth: 900,
          }}
        >
          Desenvolvimento, arquitetura, produto e aprendizados reais.
        </div>
      </div>

      <div
        style={{
          alignItems: 'center',
          color: '#737373',
          display: 'flex',
          fontSize: 20,
          justifyContent: 'space-between',
        }}
      >
        <span>vavitoarchives.com.br</span>
        <span style={{ color: '#7dd3fc' }}>↗</span>
      </div>
    </div>,
    SOCIAL_IMAGE_SIZE,
  );
}
