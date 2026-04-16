interface PdfViewerProps {
  fileUrl: string;
}

export const PdfViewer = ({ fileUrl }: PdfViewerProps) => {
  return <iframe src={fileUrl} title="PDF Viewer" className="w-full h-full" />;
};
