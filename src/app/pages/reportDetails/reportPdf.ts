export interface ReportPdfDocumentTitleInput {
  companyName: string;
  reportTitle: string;
  versionLabel: string;
}

const pathSeparatorPattern = /[\\/]+/g;
const unsafeFilenameCharacterPattern = /[<>:"|?*]/g;
const repeatedWhitespacePattern = /\s+/g;
const trailingDotOrWhitespacePattern = /[.\s]+$/g;

const removeControlCharacters = (value: string): string =>
  Array.from(value)
    .filter(character => {
      const codePoint = character.codePointAt(0) ?? 0;

      return codePoint >= 32 && codePoint !== 127;
    })
    .join('');

const sanitiseDocumentTitlePart = (value: string, fallback: string): string => {
  const sanitised = removeControlCharacters(value.normalize('NFKC'))
    .replace(pathSeparatorPattern, ' - ')
    .replace(unsafeFilenameCharacterPattern, '')
    .replace(repeatedWhitespacePattern, ' ')
    .trim()
    .replace(trailingDotOrWhitespacePattern, '');

  return sanitised || fallback;
};

export const createReportPdfDocumentTitle = ({
  companyName,
  reportTitle,
  versionLabel,
}: ReportPdfDocumentTitleInput): string =>
  [
    sanitiseDocumentTitlePart(companyName, 'Company'),
    sanitiseDocumentTitlePart(reportTitle, 'Security report'),
    sanitiseDocumentTitlePart(versionLabel, 'version'),
  ].join(' - ');

export const openReportPdfPrintFlow = (
  documentTitle: string,
  browserWindow: Pick<Window, 'print'> = window,
  browserDocument: Pick<Document, 'title'> = document,
): void => {
  const previousTitle = browserDocument.title;

  browserDocument.title = documentTitle;

  try {
    browserWindow.print();
  } finally {
    browserDocument.title = previousTitle;
  }
};
