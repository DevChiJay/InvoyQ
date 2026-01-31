"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Download, Loader2, CheckCircle2, ImageIcon, Printer } from "lucide-react";
import { toast } from "sonner";
import type { Invoice, Client } from "@/types/api";
import jsPDF from "jspdf";
import { toPng } from "html-to-image";

interface InvoicePDFViewerProps {
  invoice: Invoice;
  client?: Client;
  previewRef: React.RefObject<HTMLDivElement | null>;
}

export function InvoicePDFViewer({ invoice, previewRef }: InvoicePDFViewerProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSavingImage, setIsSavingImage] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [lastDownloaded, setLastDownloaded] = useState<string | null>(null);
  const [lastImageSaved, setLastImageSaved] = useState<string | null>(null);
  const [lastPrinted, setLastPrinted] = useState<string | null>(null);

  const handleSaveAsImage = async () => {
    if (!previewRef.current) {
      toast.error("Invoice preview not ready");
      return;
    }

    setIsSavingImage(true);
    const loadingToast = toast.loading("Capturing invoice image...");

    try {
      // Ensure the DOM is fully painted
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Use html-to-image to let the browser render CSS (avoids lab() parsing issues)
      const dataUrl = await toPng(previewRef.current, {
        pixelRatio: 2, // good quality for sharing
        cacheBust: true,
        backgroundColor: "#ffffff",
        skipFonts: false,
      });

      const link = document.createElement("a");
      const safeNumber = invoice.number ?? 'unknown';
      const filename = `invoice-${safeNumber.replace(/[^a-zA-Z0-9-]/g, "_")}.png`;
      link.href = dataUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      const now = new Date().toLocaleTimeString();
      setLastImageSaved(now);
      toast.success(`Image saved as ${filename}`, { id: loadingToast });
    } catch (error) {
      console.error("Error saving image:", error);
      toast.error("Failed to save image. Please try again.", { id: loadingToast });
    } finally {
      setIsSavingImage(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!previewRef.current) {
      toast.error("Invoice preview not ready");
      return;
    }

    setIsGenerating(true);
    const loadingToast = toast.loading("Generating PDF...");

    try {
      // Wait to ensure the node is fully painted
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Render to PNG using html-to-image (avoids html2canvas color parsing)
      const dataUrl = await toPng(previewRef.current, {
        pixelRatio: 3, // higher quality for PDF
        cacheBust: true,
        backgroundColor: "#ffffff",
        skipFonts: false,
      });

      // Load the image to get natural dimensions
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const i = new Image();
        i.onload = () => resolve(i);
        i.onerror = reject;
        i.src = dataUrl;
      });

      // PDF page size in mm (A4)
      const pdfWidth = 210;
      const pdfHeight = 297;

      // Scale the image to fit page width, keep aspect ratio
      const imgWidth = pdfWidth;
      const imgHeight = (img.height * imgWidth) / img.width;

      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4", compress: true });

      // Add first page
      pdf.addImage(dataUrl, "PNG", 0, 0, imgWidth, imgHeight, undefined, "FAST");

      // Add overflow pages if the image is taller than one page
      let heightLeft = imgHeight - pdfHeight;
      let position = -pdfHeight; // start drawing next slice higher up
      while (heightLeft > 0) {
        pdf.addPage();
        pdf.addImage(dataUrl, "PNG", 0, position, imgWidth, imgHeight, undefined, "FAST");
        heightLeft -= pdfHeight;
        position -= pdfHeight;
      }

      const safeNumber = invoice.number ?? 'unknown';
      const filename = `invoice-${safeNumber.replace(/[^a-zA-Z0-9-]/g, "_")}.pdf`;
      pdf.save(filename);

      const now = new Date().toLocaleTimeString();
      setLastDownloaded(now);
      toast.success(`PDF downloaded successfully as ${filename}`, { id: loadingToast });
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to generate PDF. Please try again.", { id: loadingToast });
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePrint = async () => {
    if (!previewRef.current) {
      toast.error("Invoice preview not ready");
      return;
    }

    setIsPrinting(true);
    const loadingToast = toast.loading("Preparing invoice for printing...");

    try {
      // Wait to ensure the node is fully painted
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Render to PNG using html-to-image
      const dataUrl = await toPng(previewRef.current, {
        pixelRatio: 3, // higher quality for print
        cacheBust: true,
        backgroundColor: "#ffffff",
        skipFonts: false,
      });

      // Load the image to get natural dimensions
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const i = new Image();
        i.onload = () => resolve(i);
        i.onerror = reject;
        i.src = dataUrl;
      });

      // PDF page size in mm (A4)
      const pdfWidth = 210;
      const pdfHeight = 297;

      // Scale the image to fit page width, keep aspect ratio
      const imgWidth = pdfWidth;
      const imgHeight = (img.height * imgWidth) / img.width;

      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4", compress: true });

      // Add first page
      pdf.addImage(dataUrl, "PNG", 0, 0, imgWidth, imgHeight, undefined, "FAST");

      // Add overflow pages if the image is taller than one page
      let heightLeft = imgHeight - pdfHeight;
      let position = -pdfHeight;
      while (heightLeft > 0) {
        pdf.addPage();
        pdf.addImage(dataUrl, "PNG", 0, position, imgWidth, imgHeight, undefined, "FAST");
        heightLeft -= pdfHeight;
        position -= pdfHeight;
      }

      // Create a blob URL and open in new window for printing
      const pdfBlob = pdf.output('blob');
      const blobUrl = URL.createObjectURL(pdfBlob);
      
      // Open in new window and trigger print
      const printWindow = window.open(blobUrl, '_blank');
      
      if (printWindow) {
        printWindow.addEventListener('load', () => {
          printWindow.print();
        });
        
        const now = new Date().toLocaleTimeString();
        setLastPrinted(now);
        toast.success("Print dialog opened", { id: loadingToast });
      } else {
        // If popup was blocked, fallback to download
        toast.warning("Pop-up blocked. Please allow pop-ups or use Download PDF instead.", { id: loadingToast });
      }
    } catch (error) {
      console.error("Error preparing print:", error);
      toast.error("Failed to prepare invoice for printing. Please try again.", { id: loadingToast });
    } finally {
      setIsPrinting(false);
    }
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold">Download & Print Invoice</h3>
              <p className="text-sm text-muted-foreground">
                Save as PDF, image, or print directly
              </p>
            </div>
            
            <div className="flex flex-wrap gap-3">
              <Button
                onClick={handleSaveAsImage}
                disabled={isSavingImage || isGenerating || isPrinting}
                size="lg"
                variant="outline"
              >
                {isSavingImage ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <ImageIcon className="mr-2 h-5 w-5" />
                    Save Image
                  </>
                )}
              </Button>

              <Button
                onClick={handlePrint}
                disabled={isPrinting || isGenerating || isSavingImage}
                size="lg"
                variant="outline"
              >
                {isPrinting ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Preparing...
                  </>
                ) : (
                  <>
                    <Printer className="mr-2 h-5 w-5" />
                    Print
                  </>
                )}
              </Button>

              <Button
                onClick={handleDownloadPDF}
                disabled={isGenerating || isSavingImage || isPrinting}
                size="lg"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-5 w-5" />
                    Download PDF
                  </>
                )}
              </Button>
            </div>
          </div>

          {(lastDownloaded || lastImageSaved || lastPrinted) && !isGenerating && !isSavingImage && !isPrinting && (
            <div className="space-y-2">
              {lastDownloaded && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground bg-green-50 dark:bg-green-950 p-3 rounded-md">
                  <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <span>PDF downloaded at {lastDownloaded}</span>
                </div>
              )}
              {lastImageSaved && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground bg-blue-50 dark:bg-blue-950 p-3 rounded-md">
                  <CheckCircle2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <span>Image saved at {lastImageSaved}</span>
                </div>
              )}
              {lastPrinted && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground bg-purple-50 dark:bg-purple-950 p-3 rounded-md">
                  <CheckCircle2 className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  <span>Print dialog opened at {lastPrinted}</span>
                </div>
              )}
            </div>
          )}

          <div className="border rounded-lg p-6 bg-muted/30">
            <div className="space-y-2 text-sm text-muted-foreground">
              <p className="flex items-center gap-2">
                <span className="font-medium text-foreground">Invoice #{invoice.number}</span>
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-3">
                <div>
                  <p className="font-medium text-foreground mb-1">📄 PDF Format:</p>
                  <p>• Professional A4 layout</p>
                  <p>• Multi-page support</p>
                  <p>• Print-ready quality</p>
                </div>
                <div>
                  <p className="font-medium text-foreground mb-1">🖨️ Print:</p>
                  <p>• Direct to printer</p>
                  <p>• Same PDF quality</p>
                  <p>• Bold borders & text</p>
                </div>
                <div>
                  <p className="font-medium text-foreground mb-1">🖼️ Image Format:</p>
                  <p>• PNG format</p>
                  <p>• Current view</p>
                  <p>• Easy to share</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
