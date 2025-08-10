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
import { textContentToPlainText } from '../utils/pdfText';
import { redactCountry } from '../utils/redact';
import { redactCountryFieldInPdf } from '../utils/pdfRedactor';

// Configure pdf.js worker so parsing runs off the main thread
pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc as any;

export default function PdfTextRedactor() {
  const [pdfText, setPdfText] = useState<string>('');
  const [displayText, setDisplayText] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [isRedacted, setIsRedacted] = useState<boolean>(false);

  const [originalBytes, setOriginalBytes] = useState<Uint8Array | null>(null);
  const [redactedBytes, setRedactedBytes] = useState<Uint8Array | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const canCopy = useMemo(() => Boolean(displayText), [displayText]);
  const canRedactText = useMemo(() => Boolean(pdfText) && !isLoading, [pdfText, isLoading]);
  const canRedactPdf = useMemo(() => Boolean(originalBytes) && !isLoading, [originalBytes, isLoading]);
  const canDownload = useMemo(() => Boolean(redactedBytes), [redactedBytes]);

  // Handle file selection or drop
  const handleFile = useCallback(async (file: File | undefined | null) => {
    setError('');
    setIsRedacted(false);
    setRedactedBytes(null);

    if (!file) return;
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setError('File không hợp lệ. Vui lòng chọn tệp PDF (.pdf).');
      return;
    }

    setIsLoading(true);
    setFileName(file.name);

    try {
      const arrayBuffer = await file.arrayBuffer();
      // Store a copy in Uint8Array to avoid detached ArrayBuffer issues
      const copyBytes = new Uint8Array(arrayBuffer.slice(0));
      setOriginalBytes(copyBytes);

      const loadingTask = pdfjsLib.getDocument({ data: copyBytes });
      const pdf = await loadingTask.promise;

      const pageTexts: string[] = [];
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

  const handleRedactText = useCallback(() => {
    const redacted = redactCountry(pdfText);
    setDisplayText(redacted);
    setIsRedacted(true);
  }, [pdfText]);

  const handleRedactPdf = useCallback(async () => {
    if (!originalBytes) return;
    setIsLoading(true);
    setError('');
    try {
      const { bytes, found } = await redactCountryFieldInPdf(originalBytes);
      setRedactedBytes(bytes);
      setIsRedacted(found);
      if (!found) {
        setError('Không tìm thấy field tên "country" trong PDF để che.');
      }
    } catch (e) {
      console.error(e);
      setError('Không thể che field trong PDF.');
    } finally {
      setIsLoading(false);
    }
  }, [originalBytes]);

  const handleReset = useCallback(() => {
    setDisplayText(pdfText);
    setIsRedacted(false);
    setRedactedBytes(null);
  }, [pdfText]);

  const handleDownload = useCallback(() => {
    if (!redactedBytes) return;
    const blob = new Blob([redactedBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const base = fileName?.replace(/\.pdf$/i, '') || 'document';
    a.download = `${base}__redacted.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [redactedBytes, fileName]);

  return (
    <PageWrapper>
      <Card>
        <Header>
          <div>
            <Title>PDF Text Redactor</Title>
            <Subtitle>Upload PDF, trích xuất text, che field "country" và tải về.</Subtitle>
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
                <LoadingOverlay $show={isLoading}>
                  <Spinner />
                </LoadingOverlay>
              </Dropzone>
            </div>

            <ErrorBox role="alert" $show={Boolean(error)}>
              <div>⚠️</div>
              <div>{error}</div>
            </ErrorBox>

            {fileName && (
              <InfoItem>
                <strong>Tệp:</strong> {fileName}
              </InfoItem>
            )}

            <ActionsRow>
              <PrimaryButton onClick={handleRedactPdf} disabled={!canRedactPdf} title="Che field trong PDF">
                Redact Country (PDF)
              </PrimaryButton>
              <GhostButton onClick={handleDownload} disabled={!canDownload} title="Tải file đã che">
                Download Redacted
              </GhostButton>
              <GhostButton onClick={handleRedactText} disabled={!canRedactText} title="Ẩn trong text viewer">
                Redact Country (Text)
              </GhostButton>
              <GhostButton onClick={handleReset} disabled={!pdfText || isLoading}>
                Hoàn tác
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
