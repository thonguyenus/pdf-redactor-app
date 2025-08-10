import React, { useCallback, useMemo, useRef, useState } from "react";
import * as pdfjsLib from "pdfjs-dist";
import workerSrc from "pdfjs-dist/build/pdf.worker.min.mjs?url";
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
  InlineSpinner,
  StatusNote,
} from "./PdfTextRedactor.styled";
import { textContentToPlainText } from "../utils/pdfText";
import { redactField } from "../utils/redact";
import { redactFieldInPdf } from "../utils/pdfRedactor";

// Configure pdf.js worker so parsing runs off the main thread
pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc as string;

// Common field types that users might want to redact
const COMMON_FIELDS = [
  "country",
  "languages",
  "phone",
  "email",
  "address",
  "birthdate",
  "ssn",
  "passport",
  "id",
  "salary",
  "experience",
  "education",
];

export default function PdfTextRedactor() {
  const [pdfText, setPdfText] = useState<string>("");
  const [displayText, setDisplayText] = useState<string>("");
  const [fileName, setFileName] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [selectedField, setSelectedField] = useState<string>("languages");
  const [customField, setCustomField] = useState<string>("");

  const [originalBytes, setOriginalBytes] = useState<Uint8Array | null>(null);
  const [redactedBytes, setRedactedBytes] = useState<Uint8Array | null>(null);

  const [isRedactingPdf, setIsRedactingPdf] = useState<boolean>(false);
  const [isPreparingDownload, setIsPreparingDownload] =
    useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const canCopy = useMemo(() => Boolean(displayText), [displayText]);
  const canRedactText = useMemo(
    () => Boolean(pdfText) && !isLoading,
    [pdfText, isLoading]
  );
  const canRedactPdf = useMemo(
    () => Boolean(originalBytes) && !isLoading && !isRedactingPdf,
    [originalBytes, isLoading, isRedactingPdf]
  );
  const canDownload = useMemo(
    () => Boolean(redactedBytes) && !isPreparingDownload,
    [redactedBytes, isPreparingDownload]
  );

  // Get the current field to redact (either selected from dropdown or custom input)
  const currentField = useMemo(() => {
    if (selectedField === "custom" && customField.trim()) {
      return customField.trim();
    }
    return selectedField;
  }, [selectedField, customField]);

  // Handle file selection or drop
  const handleFile = useCallback(async (file: File | undefined | null) => {
    setError("");
    setRedactedBytes(null);

    if (!file) return;
    if (
      file.type !== "application/pdf" &&
      !file.name.toLowerCase().endsWith(".pdf")
    ) {
      setError("File không hợp lệ. Vui lòng chọn tệp PDF (.pdf).");
      return;
    }

    setIsLoading(true);
    setFileName(file.name);

    try {
      const arrayBuffer = await file.arrayBuffer();
      // Create two independent copies: one to keep (for redaction), one for pdf.js
      const storedBytes = new Uint8Array(arrayBuffer.slice(0));
      const pdfJsBytes = new Uint8Array(arrayBuffer.slice(0));
      setOriginalBytes(storedBytes);

      const loadingTask = pdfjsLib.getDocument({ data: pdfJsBytes });
      const pdf = await loadingTask.promise;

      const pageTexts: string[] = [];
      for (let i = 1; i <= pdf.numPages; i += 1) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const pageText = textContentToPlainText(content);
        pageTexts.push(pageText);
      }

      const fullText = pageTexts.join("\n\n");
      setPdfText(fullText);
      setDisplayText(fullText);
    } catch (error) {
      console.error(error);
      setError("Không thể đọc nội dung PDF. Vui lòng thử lại với tệp hợp lệ.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const onInputChange = useCallback(
    async (ev: React.ChangeEvent<HTMLInputElement>) => {
      const file = ev.target.files?.[0] ?? null;
      await handleFile(file);
      if (fileInputRef.current) fileInputRef.current.value = "";
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
      await navigator.clipboard.writeText(displayText || "");
    } catch (_error) {
      const textarea = document.createElement("textarea");
      textarea.value = displayText || "";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }
  }, [displayText]);

  const handleRedactText = useCallback(() => {
    const redacted = redactField(pdfText, currentField);
    setDisplayText(redacted);
  }, [pdfText, currentField]);

  const handleRedactPdf = useCallback(async () => {
    if (!originalBytes) return;
    setIsRedactingPdf(true);
    setError("");
    try {
      const { bytes, found } = await redactFieldInPdf(
        originalBytes,
        currentField
      );
      setRedactedBytes(bytes);
      if (!found) {
        setError(
          `Không tìm thấy field "${currentField}" trong PDF để che. Field này có thể không tồn tại trong nội dung PDF.`
        );
      }
    } catch (error) {
      console.error(error);
      setError("Không thể che field trong PDF.");
    } finally {
      setIsRedactingPdf(false);
    }
  }, [originalBytes, currentField]);

  const handleReset = useCallback(() => {
    setDisplayText(pdfText);
    setRedactedBytes(null);
  }, [pdfText]);

  const handleDownload = useCallback(() => {
    if (!redactedBytes) return;
    setIsPreparingDownload(true);
    try {
      const blob = new Blob([redactedBytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const base = fileName?.replace(/\.pdf$/i, "") || "document";
      a.download = `${base}__redacted.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } finally {
      setIsPreparingDownload(false);
    }
  }, [redactedBytes, fileName]);

  return (
    <PageWrapper>
      <Card>
        <Header>
          <div>
            <Title>PDF Text Redactor</Title>
            <Subtitle>
              Upload PDF, trích xuất text, che field trong nội dung và tải về.
            </Subtitle>
          </div>
        </Header>

        <Content>
          <UploadSection>
            <div style={{ position: "relative" }}>
              <Dropzone onDrop={onDrop} onDragOver={onDragOver}>
                <DropIcon>PDF</DropIcon>
                <DropHeadline>
                  Kéo thả PDF vào đây hoặc bấm để chọn
                </DropHeadline>
                <DropSub>
                  Chỉ hỗ trợ tệp .pdf. Dữ liệu được xử lý ngay trên trình duyệt.
                </DropSub>
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

            {/* Field Selection */}
            <div style={{ marginBottom: "1rem" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "0.5rem",
                  fontWeight: "bold",
                }}
              >
                Chọn field cần che:
              </label>
              <select
                value={selectedField}
                onChange={(e) => setSelectedField(e.target.value)}
                style={{
                  padding: "0.5rem",
                  borderRadius: "4px",
                  border: "1px solid #ccc",
                  marginRight: "0.5rem",
                  minWidth: "150px",
                }}
              >
                {COMMON_FIELDS.map((field) => (
                  <option key={field} value={field}>
                    {field.charAt(0).toUpperCase() + field.slice(1)}
                  </option>
                ))}
                <option value="custom">Tùy chỉnh...</option>
              </select>

              {selectedField === "custom" && (
                <input
                  type="text"
                  value={customField}
                  onChange={(e) => setCustomField(e.target.value)}
                  placeholder="Nhập tên field..."
                  style={{
                    padding: "0.5rem",
                    borderRadius: "4px",
                    border: "1px solid #ccc",
                    minWidth: "200px",
                  }}
                />
              )}
            </div>

            <ActionsRow>
              <PrimaryButton
                onClick={handleRedactPdf}
                disabled={!canRedactPdf}
                title={`Che field "${currentField}" trong PDF`}
              >
                {isRedactingPdf ? (
                  <>
                    <InlineSpinner /> Đang redact PDF...
                  </>
                ) : (
                  `Redact ${
                    currentField.charAt(0).toUpperCase() + currentField.slice(1)
                  } (PDF)`
                )}
              </PrimaryButton>
              <GhostButton
                onClick={handleDownload}
                disabled={!canDownload}
                title="Tải file đã che"
              >
                {isPreparingDownload ? (
                  <>
                    <InlineSpinner /> Đang chuẩn bị tải...
                  </>
                ) : (
                  "Download Redacted"
                )}
              </GhostButton>
              <GhostButton
                onClick={handleRedactText}
                disabled={!canRedactText}
                title={`Ẩn field "${currentField}" trong text viewer`}
              >
                Redact{" "}
                {currentField.charAt(0).toUpperCase() + currentField.slice(1)}{" "}
                (Text)
              </GhostButton>
              <GhostButton
                onClick={handleReset}
                disabled={!pdfText || isLoading}
              >
                Hoàn tác
              </GhostButton>
            </ActionsRow>

            {isRedactingPdf && (
              <StatusNote>
                Đang xử lý che field "{currentField}" trong PDF. Vui lòng đợi...
              </StatusNote>
            )}
            {redactedBytes && !isRedactingPdf && (
              <StatusNote>
                PDF đã được che field "{currentField}". Bạn có thể tải xuống
                bằng nút "Download Redacted".
              </StatusNote>
            )}
            {error && !isRedactingPdf && (
              <StatusNote
                style={{ color: "#d32f2f", backgroundColor: "#ffebee" }}
              >
                <strong>Lưu ý:</strong> {error}
                <br />
                <small>
                  💡 <strong>Giải pháp:</strong> Sử dụng nút "Redact{" "}
                  {currentField.charAt(0).toUpperCase() + currentField.slice(1)}{" "}
                  (Text)" để che field trong text viewer, hoặc kiểm tra lại tên
                  field cần che.
                </small>
              </StatusNote>
            )}
          </UploadSection>

          <ViewerSection>
            <ViewerHeader>
              <ViewerTitle>Text Viewer</ViewerTitle>
              <ViewerTools>
                <GhostButton
                  onClick={handleCopy}
                  disabled={!canCopy}
                  title="Sao chép toàn bộ text"
                >
                  Copy
                </GhostButton>
              </ViewerTools>
            </ViewerHeader>
            <TextViewer aria-label="Extracted text viewer">
              {displayText ||
                "Chưa có nội dung. Hãy upload một tệp PDF để xem nội dung."}
            </TextViewer>
          </ViewerSection>
        </Content>
      </Card>
    </PageWrapper>
  );
}
