import React, { useCallback, useMemo, useRef, useState } from 'react';
import styled, { keyframes } from 'styled-components';
import * as pdfjsLib from 'pdfjs-dist';
import workerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

// Configure pdf.js worker so parsing runs off the main thread
pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;

// ===== Styled Components =====
const PageWrapper = styled.div`
  min-height: 100vh;
  background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
`;

const Card = styled.div`
  width: 100%;
  max-width: 980px;
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 0 10px 30px rgba(2, 6, 23, 0.08);
  overflow: hidden;
`;

const Header = styled.div`
  padding: 20px 24px;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  gap: 12px;
  background: #ffffff;
`;

const Title = styled.h1`
  margin: 0;
  font-size: 18px;
  line-height: 1.2;
  font-weight: 700;
  color: #0f172a;
`;

const Subtitle = styled.p`
  margin: 2px 0 0 0;
  font-size: 13px;
  color: #64748b;
`;

const Content = styled.div`
  padding: 20px 24px 24px 24px;
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;

  @media (min-width: 960px) {
    grid-template-columns: 420px 1fr;
    align-items: start;
  }
`;

const UploadSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const Dropzone = styled.label`
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 24px;
  border: 2px dashed #cbd5e1;
  border-radius: 14px;
  background: #f8fafc;
  color: #0f172a;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: #f1f5f9;
    border-color: #94a3b8;
  }

  &:focus-within {
    outline: 3px solid #bfdbfe;
    outline-offset: 2px;
  }
`;

const DropIcon = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: grid;
  place-items: center;
  background: #e2e8f0;
  color: #0f172a;
  font-weight: 800;
`;

const DropHeadline = styled.div`
  font-size: 16px;
  font-weight: 600;
`;

const DropSub = styled.div`
  font-size: 12px;
  color: #64748b;
`;

const HiddenFileInput = styled.input`
  position: absolute;
  inset: 0;
  opacity: 0;
  cursor: pointer;
`;

const ActionsRow = styled.div`
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
`;

const Button = styled.button`
  appearance: none;
  border: 0;
  border-radius: 12px;
  padding: 10px 14px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.05s ease, background 0.2s ease, box-shadow 0.2s ease;
  display: inline-flex;
  align-items: center;
  gap: 8px;

  &:active {
    transform: translateY(1px);
  }
`;

const PrimaryButton = styled(Button)`
  background: #0ea5e9;
  color: white;
  box-shadow: 0 8px 16px rgba(14, 165, 233, 0.25);

  &:hover {
    background: #0284c7;
  }

  &:disabled {
    background: #94a3b8;
    box-shadow: none;
    cursor: not-allowed;
  }
`;

const GhostButton = styled(Button)`
  background: #f1f5f9;
  color: #0f172a;

  &:hover {
    background: #e2e8f0;
  }
`;

const ErrorBox = styled.div`
  display: ${props => (props.show ? 'flex' : 'none')};
  align-items: flex-start;
  gap: 10px;
  padding: 12px 14px;
  border-radius: 12px;
  background: #fee2e2;
  color: #7f1d1d;
  border: 1px solid #fecaca;
  font-size: 13px;
`;

const InfoItem = styled.div`
  font-size: 12px;
  color: #475569;
`;

const ViewerSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const ViewerHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const ViewerTitle = styled.div`
  font-weight: 700;
  color: #0f172a;
`;

const ViewerTools = styled.div`
  display: flex;
  gap: 8px;
`;

const TextViewer = styled.pre`
  margin: 0;
  padding: 16px;
  border-radius: 14px;
  background: #0b1220;
  color: #e2e8f0;
  max-height: 60vh;
  overflow: auto;
  line-height: 1.6;
  font-size: 13px;
  white-space: pre-wrap;
  word-wrap: break-word;
  box-shadow: inset 0 0 0 1px rgba(148, 163, 184, 0.2);
`;

const fade = keyframes`
  0% { opacity: 0; transform: translateY(4px); }
  100% { opacity: 1; transform: translateY(0); }
`;

const LoadingOverlay = styled.div`
  position: absolute;
  inset: 0;
  display: ${props => (props.show ? 'grid' : 'none')};
  place-items: center;
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(2px);
  border-radius: 14px;
  animation: ${fade} 0.2s ease both;
`;

const spinnerAnim = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

const Spinner = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 3px solid #cbd5e1;
  border-top-color: #0ea5e9;
  animation: ${spinnerAnim} 0.9s linear infinite;
`;

// ===== Helpers =====
/**
 * Replace the value of the field named "country" with block characters.
 * Attempts to cover common patterns (plain text, key-value with :, =, JSON-like).
 */
function redactCountry(text) {
  if (!text) return text;

  let result = text;

  // Pattern 1: key-value pairs e.g. "country: Vietnam" or "Country = US"
  result = result.replace(/(country\s*[:=]\s*)([^\r\n,;]+)/gi, (m, p1, p2) => {
    const blocks = '█'.repeat(p2.trim().length || 6);
    return `${p1}${blocks}`;
  });

  // Pattern 2: JSON-like e.g. "\"country\": \"Vietnam\""
  result = result.replace(/("country"\s*:\s*")(.*?)(")/gi, (m, p1, p2, p3) => {
    const blocks = '█'.repeat(p2.trim().length || 6);
    return `${p1}${blocks}${p3}`;
  });

  // Pattern 3: Standalone lines e.g. "Country Vietnam"
  result = result.replace(/(country\s+)([^\r\n]+)/gi, (m, p1, p2) => {
    const blocks = '█'.repeat(p2.trim().length || 6);
    return `${p1}${blocks}`;
  });

  return result;
}

// ===== Component =====
/**
 * PdfTextRedactor
 * - Upload PDF file via click or drag & drop
 * - Parse text content in-browser using pdfjs-dist
 * - Display text in a viewer with Copy and Redact actions
 */
export default function PdfTextRedactor() {
  const [pdfText, setPdfText] = useState('');
  const [displayText, setDisplayText] = useState('');
  const [fileName, setFileName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isRedacted, setIsRedacted] = useState(false);

  const fileInputRef = useRef(null);

  const canCopy = useMemo(() => Boolean(displayText), [displayText]);
  const canRedact = useMemo(() => Boolean(pdfText) && !isLoading, [pdfText, isLoading]);

  // Handle file selection or drop
  const handleFile = useCallback(async (file) => {
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

      let fullText = '';
      for (let i = 1; i <= pdf.numPages; i += 1) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const strings = content.items.map((it) => (typeof it.str === 'string' ? it.str : ''));
        fullText += strings.join(' ') + (i < pdf.numPages ? '\n\n' : '');
      }

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
    async (ev) => {
      const file = ev.target.files?.[0];
      await handleFile(file);
      // Reset input so same file can be re-selected
      if (fileInputRef.current) fileInputRef.current.value = '';
    },
    [handleFile]
  );

  const onDrop = useCallback(
    async (ev) => {
      ev.preventDefault();
      const file = ev.dataTransfer.files?.[0];
      await handleFile(file);
    },
    [handleFile]
  );

  const onDragOver = useCallback((ev) => {
    ev.preventDefault();
  }, []);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(displayText || '');
    } catch (e) {
      // Fallback for older browsers
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
