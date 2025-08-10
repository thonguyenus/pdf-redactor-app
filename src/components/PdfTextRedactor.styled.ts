import styled, { keyframes } from 'styled-components';

export const PageWrapper = styled.div`
  min-height: 100vh;
  background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
`;

export const Card = styled.div`
  width: 100%;
  max-width: 980px;
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 0 10px 30px rgba(2, 6, 23, 0.08);
  overflow: hidden;
`;

export const Header = styled.div`
  padding: 20px 24px;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  gap: 12px;
  background: #ffffff;
`;

export const Title = styled.h1`
  margin: 0;
  font-size: 18px;
  line-height: 1.2;
  font-weight: 700;
  color: #0f172a;
`;

export const Subtitle = styled.p`
  margin: 2px 0 0 0;
  font-size: 13px;
  color: #64748b;
`;

export const Content = styled.div`
  padding: 20px 24px 24px 24px;
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;

  @media (min-width: 960px) {
    grid-template-columns: 420px 1fr;
    align-items: start;
  }
`;

export const UploadSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

export const Dropzone = styled.label`
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

export const DropIcon = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: grid;
  place-items: center;
  background: #e2e8f0;
  color: #0f172a;
  font-weight: 800;
`;

export const DropHeadline = styled.div`
  font-size: 16px;
  font-weight: 600;
`;

export const DropSub = styled.div`
  font-size: 12px;
  color: #64748b;
`;

export const HiddenFileInput = styled.input`
  position: absolute;
  inset: 0;
  opacity: 0;
  cursor: pointer;
`;

export const ActionsRow = styled.div`
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
`;

export const Button = styled.button`
  appearance: none;
  border: 0;
  border-radius: 12px;
  padding: 10px 14px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.05s ease, background 0.2s ease, box-shadow 0.2s ease, opacity 0.2s ease;
  display: inline-flex;
  align-items: center;
  gap: 8px;

  &:active {
    transform: translateY(1px);
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.8;
  }
`;

export const PrimaryButton = styled(Button)`
  background: #0ea5e9;
  color: white;
  box-shadow: 0 8px 16px rgba(14, 165, 233, 0.25);

  &:hover {
    background: #0284c7;
  }

  &:disabled {
    background: #94a3b8;
    box-shadow: none;
  }
`;

export const GhostButton = styled(Button)`
  background: #f1f5f9;
  color: #0f172a;

  &:hover {
    background: #e2e8f0;
  }
`;

export const ErrorBox = styled.div<{ $show?: boolean; }>`
  display: ${props => (props.$show ? 'flex' : 'none')};
  align-items: flex-start;
  gap: 10px;
  padding: 12px 14px;
  border-radius: 12px;
  background: #fee2e2;
  color: #7f1d1d;
  border: 1px solid #fecaca;
  font-size: 13px;
`;

export const InfoItem = styled.div`
  font-size: 12px;
  color: #475569;
`;

export const ViewerSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

export const ViewerHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

export const ViewerTitle = styled.div`
  font-weight: 700;
  color: #0f172a;
`;

export const ViewerTools = styled.div`
  display: flex;
  gap: 8px;
`;

export const TextViewer = styled.pre`
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

export const fade = keyframes`
  0% { opacity: 0; transform: translateY(4px); }
  100% { opacity: 1; transform: translateY(0); }
`;

export const LoadingOverlay = styled.div<{ $show?: boolean; }>`
  position: absolute;
  inset: 0;
  display: ${props => (props.$show ? 'grid' : 'none')};
  place-items: center;
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(2px);
  border-radius: 14px;
  animation: ${fade} 0.2s ease both;
`;

export const spinnerAnim = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

export const Spinner = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 3px solid #cbd5e1;
  border-top-color: #0ea5e9;
  animation: ${spinnerAnim} 0.9s linear infinite;
`;

export const InlineSpinner = styled.span`
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 2px solid #cbd5e1;
  border-top-color: #0ea5e9;
  display: inline-block;
  animation: ${spinnerAnim} 0.9s linear infinite;
`;

export const StatusNote = styled.div`
  font-size: 12px;
  color: #0f766e;
  background: #ecfdf5;
  border: 1px solid #99f6e4;
  padding: 8px 10px;
  border-radius: 10px;
`;
