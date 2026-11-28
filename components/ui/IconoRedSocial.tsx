/**
 * Iconos SVG para redes sociales — identidad visual Peache.
 * SVG inline para evitar dependencias externas y mantener control total
 * del color y el tamaño.
 */
export type RedSocial = "instagram" | "facebook" | "whatsapp";

export function IconoRedSocial({ red }: { red: RedSocial }) {
  switch (red) {
    case "instagram":
      return (
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
          <line x1="17.5" y1="17.5" x2="17.51" y2="17.5" />
        </svg>
      );
    case "facebook":
      return (
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
        </svg>
      );
    case "whatsapp":
      return (
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M22 12c0-4.71-3.81-8.53-8.53-8.53S5 7.29 5 12c0 3.73 2.42 6.88 5.76 7.95v-5.63h-1.8v-2.47h1.8v-1.43c0-1.17.77-1.95 1.85-1.95h2.22v3.43l-1.15.97c-.4.33-.65.91-.65 1.64v1.43h2.22c1.11 0 1.85-.36 1.85-1.01v-2.43c0-1.09-.69-1.96-1.76-2.13z" />
        </svg>
      );
  }
}
