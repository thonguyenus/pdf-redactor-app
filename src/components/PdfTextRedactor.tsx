import React, { useCallback, useMemo, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import workerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import {
  PageWrapper,
  Card,
  Header,
  Title,
  Subtitle,
  Content,
  UploadSection,
  Dropzone,
  DropIcon,
  DropHeadline,
  DropSub,
  HiddenFileInput,
  ActionsRow,
  PrimaryButton,
  GhostButton,
  ErrorBox,
  InfoItem,
  ViewerSection,
  ViewerHeader,
  ViewerTitle,
  ViewerTools,
  TextViewer,
  LoadingOverlay,
  Spinner,
} from './PdfTextRedactor.styled';
import { redactCountry } from '../utils/redact';
import { textContentToPlainText } from '../utils/pdfText';

// Configure pdf.js worker so parsing runs off the main thread
pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;

/**
 * PdfTextRedactor
 * - Upload PDF file via click or drag & drop
 * - Parse text content in-browser using pdfjs-dist
 * - Display text in a viewer with Copy and Redact actions
 */
export default function PdfTextRedactor() {
  const [pdfText, setPdfText] = useState<string>('');
  const [displayText, setDisplayText] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [isRedacted, setIsRedacted] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const canCopy = useMemo(() => Boolean(displayText), [displayText]);
  const canRedact = useMemo(() => Boolean(pdfText) && !isLoading, [pdfText, isLoading]);

  // Handle file selection or drop
  const handleFile = useCallback(async (file: File | undefined | null) => {
    setError('');
    setIsRedacted(false);

    if (!file) return;
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setError('File không hợp lệ. Vui lòng chọn tệp PDF (.pdf).');
      return;
    }

    setIsLoading(true);
    setFileName(file.name);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;

      const pageTexts = [];
      for (let i = 1; i <= pdf.numPages; i += 1) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const pageText = textContentToPlainText(content);
        pageTexts.push(pageText);
      }

      const fullText = pageTexts.join('\n\n');
      setPdfText(fullText);
      setDisplayText(fullText);
    } catch (e) {
      console.error(e);
      setError('Không thể đọc nội dung PDF. Vui lòng thử lại với tệp hợp lệ.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const onInputChange = useCallback(
    async (ev: React.ChangeEvent<HTMLInputElement>) => {
      const file = ev.target.files?.[0] ?? null;
      await handleFile(file);
      // Reset input so same file can be re-selected
      if (fileInputRef.current) fileInputRef.current.value = '';
    },
    [handleFile]
  );

  const onDrop = useCallback(
    async (ev: React.DragEvent<HTMLLabelElement>) => {
      ev.preventDefault();
      const file = ev.dataTransfer.files?.[0];
      await handleFile(file);
    },
    [handleFile]
  );

  const onDragOver = useCallback((ev: React.DragEvent<HTMLLabelElement>) => {
    ev.preventDefault();
  }, []);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(displayText || '');
    } catch (e) {
      const textarea = document.createElement('textarea');
      textarea.value = displayText || '';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
  }, [displayText]);

  const handleRedact = useCallback(() => {
    const redacted = redactCountry(pdfText);
    setDisplayText(redacted);
    setIsRedacted(true);
  }, [pdfText]);

  const handleReset = useCallback(() => {
    setDisplayText(pdfText);
    setIsRedacted(false);
  }, [pdfText]);

  return (
    <PageWrapper>
      <Card>
        <Header>
          <div>
            <Title>PDF Text Redactor</Title>
            <Subtitle>Upload PDF, trích xuất text và ẩn giá trị của field "country".</Subtitle>
          </div>
        </Header>

        <Content>
          <UploadSection>
            <div style={{ position: 'relative' }}>
              <Dropzone onDrop={onDrop} onDragOver={onDragOver}>
                <DropIcon>PDF</DropIcon>
                <DropHeadline>Kéo thả PDF vào đây hoặc bấm để chọn</DropHeadline>
                <DropSub>Chỉ hỗ trợ tệp .pdf. Dữ liệu được xử lý ngay trên trình duyệt.</DropSub>
                <HiddenFileInput
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf"
                  onChange={onInputChange}
                />
                <LoadingOverlay show={isLoading}>
                  <Spinner />
                </LoadingOverlay>
              </Dropzone>
            </div>

            <ErrorBox role="alert" show={Boolean(error)}>
              <div>⚠️</div>
              <div>{error}</div>
            </ErrorBox>

            {fileName && (
              <InfoItem>
                <strong>Tệp:</strong> {fileName}
              </InfoItem>
            )}

            <ActionsRow>
              <PrimaryButton onClick={handleRedact} disabled={!canRedact} title="Ẩn giá trị country">
                Redact Country
              </PrimaryButton>
              <GhostButton onClick={handleReset} disabled={!pdfText || isLoading || !isRedacted}>
                Hoàn tác Redact
              </GhostButton>
            </ActionsRow>
          </UploadSection>

          <ViewerSection>
            <ViewerHeader>
              <ViewerTitle>Text Viewer</ViewerTitle>
              <ViewerTools>
                <GhostButton onClick={handleCopy} disabled={!canCopy} title="Sao chép toàn bộ text">
                  Copy
                </GhostButton>
              </ViewerTools>
            </ViewerHeader>
            <TextViewer aria-label="Extracted text viewer">
              {displayText || 'Chưa có nội dung. Hãy upload một tệp PDF để xem nội dung.'}
            </TextViewer>
          </ViewerSection>
        </Content>
      </Card>
    </PageWrapper>
  );
}
