"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import jsPDF from "jspdf";
// Use html2canvas-pro instead of html2canvas
import html2canvas from "html2canvas-pro";

interface DownloadOptionsProps {
  markdown: string;
  filename?: string;
}

export default function DownloadOptions({ markdown, filename = "note" }: DownloadOptionsProps) {
  const downloadMarkdown = () => {
    const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const safe = filename.replace(/[^a-z0-9-_ ]/gi, "_");
    a.download = `${safe}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadPreviewPDF = async () => {
    const element = document.getElementById("preview-container");
    if (!element) return;

    // Save original inline styles
    const originalStyles = element.getAttribute("style") || "";

    // Apply safe colors for PDF rendering
    element.style.backgroundColor = "#ffffff"; // white background
    element.style.color = "#000000"; // black text

    // Optionally, fix all child elements that use unsupported color functions
    const descendants = element.querySelectorAll("*");
    const originalDescendantStyles: string[] = [];
    descendants.forEach((el, i) => {
      originalDescendantStyles[i] = el.getAttribute("style") || "";
      const computed = window.getComputedStyle(el);
      if (computed.color.includes("oklch")) {
        el.setAttribute("style", `color: #000000 !important; ${originalDescendantStyles[i]}`);
      }
      if (computed.backgroundColor.includes("oklch")) {
        el.setAttribute("style", `background-color: #ffffff !important; ${originalDescendantStyles[i]}`);
      }
    });

    // Render the container as canvas using html2canvas-pro
    const canvas = await html2canvas(element, { scale: 2 });

    // Restore original styles
    element.setAttribute("style", originalStyles);
    descendants.forEach((el, i) => el.setAttribute("style", originalDescendantStyles[i]));

    const imgData = canvas.toDataURL("image/png");

    const pdf = new jsPDF("p", "mm", "a4");
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
    pdf.save(`${filename.replace(/[^a-z0-9-_ ]/gi, "_")}.pdf`);
  };

  return (
    <div className="flex flex-col sm:flex-row gap-2 items-stretch">
      <Button onClick={downloadMarkdown} className="w-full sm:w-auto">
        Download MD
      </Button>
      <Button onClick={downloadPreviewPDF} className="w-full sm:w-auto">
        Download PDF
      </Button>
    </div>
  );
}
