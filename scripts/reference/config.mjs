// Bibliotecas documentadas. O .api.json de cada uma vem anexado ao release do pbsu-loader (release.ps1).
export const SOURCE_REPOSITORY = 'Sebola3461/pbsu-loader';

export const COMPONENTS = [
	{ assembly: 'PBSLoaderCommonUtils', tagPrefix: 'pbsloadercommonutils-v' },
	{ assembly: 'PBSLoaderCommonInterface', tagPrefix: 'pbsloadercommoninterface-v' },
];

export const SUPPORTED_SCHEMA = 1;
export const MAX_API_BYTES = 20 * 1024 * 1024;

// Pasta (dentro de src/content/docs) e prefixo das URLs da referência gerada.
export const OUTPUT_FOLDER = 'referencia';
