const toolMeta = {
  "pdf-to-pixel": {
    title: "PDF to Pixel Converter",
    description: "Upload a PDF and turn it into a clean pixel-based rendering for quick sharing and display.",
    accepted: ".pdf",
    resultLabel: "pixel-render"
  },
  "pixel-to-pdf": {
    title: "Pixel to PDF Converter",
    description: "Convert screenshots, photos, or drawings into a polished PDF document.",
    accepted: "image/*",
    resultLabel: "image-pdf"
  },
  "pdf-splitter": {
    title: "PDF Splitter",
    description: "Break larger documents into smaller, neatly separated files.",
    accepted: ".pdf",
    resultLabel: "split-pdf"
  },
  "pdf-merger": {
    title: "PDF Merger",
    description: "Combine multiple files into one organized PDF package.",
    accepted: ".pdf",
    resultLabel: "merged-pdf"
  },
  "pdf-compressor": {
    title: "PDF Compressor",
    description: "Reduce file size quickly without losing readability.",
    accepted: ".pdf",
    resultLabel: "compressed-pdf"
  },
  "pdf-to-image": {
    title: "PDF to Image Converter",
    description: "Export each PDF page into crisp image files for presentations or web use.",
    accepted: ".pdf",
    resultLabel: "pdf-images"
  },
  "image-to-pdf": {
    title: "Image to PDF Converter",
    description: "Turn your photos and scanned pages into a professional PDF file.",
    accepted: "image/*",
    resultLabel: "image-pdf"
  },
  "pdf-rotation": {
    title: "PDF Rotation Tool",
    description: "Rotate pages into the correct orientation with minimal effort.",
    accepted: ".pdf",
    resultLabel: "rotated-pdf"
  },
  "pdf-page-extractor": {
    title: "PDF Page Extractor",
    description: "Select and export the exact pages you need from a larger document.",
    accepted: ".pdf",
    resultLabel: "extracted-pages"
  },
  "pdf-utilities": {
    title: "Other PDF Utilities",
    description: "Unlock, watermark, and organize your PDF documents with confidence.",
    accepted: ".pdf",
    resultLabel: "pdf-utilities"
  }
};

const params = new URLSearchParams(window.location.search);
const activeTool = params.get("tool") || "pdf-to-pixel";
const tool = toolMeta[activeTool] || toolMeta["pdf-to-pixel"];

const titleEl = document.getElementById("tool-title");
const descriptionEl = document.getElementById("tool-description");
const dropzone = document.getElementById("dropzone");
const fileInput = document.getElementById("fileInput");
const uploadMeta = document.getElementById("upload-meta");
const processBtn = document.getElementById("processBtn");
const resultBox = document.getElementById("resultBox");
const resultText = document.getElementById("resultText");
const downloadBtn = document.getElementById("downloadBtn");
const progressBar = document.getElementById("progressBar");
const stepEls = Array.from(document.querySelectorAll(".step"));

if (titleEl) {
  titleEl.textContent = tool.title;
}

if (descriptionEl) {
  descriptionEl.textContent = tool.description;
}

if (dropzone && fileInput) {
  dropzone.setAttribute("data-accept", tool.accepted);
  dropzone.addEventListener("click", () => fileInput.click());
  fileInput.setAttribute("accept", tool.accepted);
}
const splitOptions =
  document.getElementById("splitOptions");

if (
  activeTool === "pdf-splitter" &&
  splitOptions
) {
  splitOptions.style.display = "block";
}

let selectedFile = null;
let downloadUrl = null;

function updateUploadMeta(file) {
  if (!uploadMeta) return;
  uploadMeta.innerHTML = `Selected file: <strong>${file.name}</strong> (${(file.size / 1024).toFixed(1)} KB)`;
}

function setStep(index, state) {
  stepEls.forEach((step, idx) => {
    step.classList.remove("active", "done");
    if (idx < index) {
      step.classList.add("done");
    } else if (idx === index) {
      step.classList.add("active");
    }
  });
}
async function pdfToImage(file) {
  const arrayBuffer = await file.arrayBuffer();

  const pdf = await pdfjsLib.getDocument({
    data: arrayBuffer
  }).promise;

  const page = await pdf.getPage(1);

  const viewport = page.getViewport({ scale: 2 });

  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  canvas.width = viewport.width;
  canvas.height = viewport.height;

  await page.render({
    canvasContext: context,
    viewport: viewport
  }).promise;

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve(blob);
    }, "image/png");
  });
}

async function imageToPdf(file) {
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF();

  const imgUrl = URL.createObjectURL(file);

  return new Promise((resolve) => {
    const img = new Image();

    img.onload = () => {
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight =
        (img.height * pageWidth) / img.width;
      pdf.addImage(
        img,
        "JPEG",
        0,
        0,
        pageWidth,
        pageHeight
      );

      const blob = pdf.output("blob");

      URL.revokeObjectURL(imgUrl);
      resolve(blob);
    };

    img.src = imgUrl;
  });
}
async function mergePdfs(files) {

  const mergedPdf = await PDFLib.PDFDocument.create();

  for (const file of files) {

    const bytes = await file.arrayBuffer();

    const pdf = await PDFLib.PDFDocument.load(bytes);

    const pages = await mergedPdf.copyPages(
      pdf,
      pdf.getPageIndices()
    );

    pages.forEach(page => {
      mergedPdf.addPage(page);
    });
  }

  const mergedBytes = await mergedPdf.save();

  return new Blob(
    [mergedBytes],
    { type: "application/pdf" }
  );
}
  async function rotatePdf(file, angle) {

  const bytes =
    await file.arrayBuffer();

  const pdfDoc =
    await PDFLib.PDFDocument.load(bytes);

  pdfDoc.getPages().forEach(page => {
    page.setRotation(
      PDFLib.degrees(angle)
    );
  });

  const pdfBytes =
    await pdfDoc.save();

  return new Blob(
    [pdfBytes],
    {
      type: "application/pdf"
    }
  );
}    

async function splitPdf(file) {

  const bytes = await file.arrayBuffer();

  const pdf = await PDFLib.PDFDocument.load(bytes);

  const newPdf = await PDFLib.PDFDocument.create();

  const [page] = await newPdf.copyPages(pdf, [0]);

  newPdf.addPage(page);

  const pdfBytes = await newPdf.save();

  return new Blob(
    [pdfBytes],
    { type: "application/pdf" }
  );
}
function resetSteps() {
  setStep(0, "active");

  if (progressBar) {
    progressBar.style.width = "0%";
  }

  if (resultBox) {
    resultBox.classList.add("hidden");
  }

  if (downloadUrl) {
    URL.revokeObjectURL(downloadUrl);
    downloadUrl = null;
  }

  }


if (fileInput) {
  fileInput.addEventListener("change", (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    selectedFile = file;
    updateUploadMeta(file);
    resetSteps();
  });
}

if (dropzone) {
  ["dragenter", "dragover"].forEach((eventName) => {
    dropzone.addEventListener(eventName, (event) => {
      event.preventDefault();
      dropzone.style.borderColor = "#a71e1e";
    });
  });

  ["dragleave", "drop"].forEach((eventName) => {
    dropzone.addEventListener(eventName, (event) => {
      event.preventDefault();
      dropzone.style.borderColor = "#d62828";
    });
  });

  dropzone.addEventListener("drop", (event) => {
    const file = event.dataTransfer?.files?.[0];
    if (!file) return;
    selectedFile = file;
    updateUploadMeta(file);
    resetSteps();
  });
}

if (processBtn) {
  processBtn.addEventListener("click", () => {
    if (!selectedFile) {
      uploadMeta.innerHTML = "Please choose a file first so the workflow can begin.";
      return;
    }
(async () => {

  try {

    let outputBlob;

    if (
      activeTool === "pdf-to-image" ||
      activeTool === "pdf-to-pixel"
    ) {

      outputBlob = await pdfToImage(selectedFile);

      downloadUrl =
        URL.createObjectURL(outputBlob);

      downloadBtn.href = downloadUrl;
      downloadBtn.download = "converted-image.png";
    }

    else if (
      activeTool === "image-to-pdf" ||
      activeTool === "pixel-to-pdf"
    ) {

      outputBlob =
        await imageToPdf(selectedFile);

      downloadUrl =
        URL.createObjectURL(outputBlob);

      downloadBtn.href = downloadUrl;
      downloadBtn.download = "converted.pdf";
    }
      else if (
  activeTool === "pdf-merger"
) {

  const files = Array.from(fileInput.files);

  outputBlob = await mergePdfs(files);

  downloadUrl = URL.createObjectURL(outputBlob);

  downloadBtn.href = downloadUrl;

  downloadBtn.download = "merged.pdf";
}
      
    else if (
  activeTool === "pdf-splitter"
) {
  console.log(document.getElementById("startPage"));
console.log(document.getElementById("endPage"));
  const startPage =
    parseInt(
      document.getElementById("startPage").value
    );

  const endPage =
    parseInt(
      document.getElementById("endPage").value
    );

  const pdfDoc =
    await PDFLib.PDFDocument.load(
      await selectedFile.arrayBuffer()
    );

  const totalPages =
    pdfDoc.getPageCount();

  if (
    startPage < 1 ||
    endPage > totalPages ||
    startPage > endPage
  ) {
    throw new Error(
      `Please enter pages between 1 and ${totalPages}`
    );
  }

  const newPdf =
    await PDFLib.PDFDocument.create();

  const pageIndexes = [];

  for (
    let i = startPage - 1;
    i <= endPage - 1;
    i++
  ) {
    pageIndexes.push(i);
  }

  const pages =
    await newPdf.copyPages(
      pdfDoc,
      pageIndexes
    );

  pages.forEach(page =>
    newPdf.addPage(page)
  );

  const pdfBytes =
    await newPdf.save();

  outputBlob = new Blob(
    [pdfBytes],
    {
      type: "application/pdf"
    }
  );

  downloadUrl =
    URL.createObjectURL(outputBlob);

  downloadBtn.href =
    downloadUrl;

  downloadBtn.download =
    `pages-${startPage}-${endPage}.pdf`;
}
      
else if (
  activeTool === "pdf-rotation"
) {
  const angle =
  parseInt(
    document.getElementById("rotateAngle").value
  );

outputBlob =
  await rotatePdf(
    selectedFile,
    angle
  );

  downloadUrl =
    URL.createObjectURL(outputBlob);

  downloadBtn.href =
    downloadUrl;

  downloadBtn.download =
    "rotated.pdf";
}
    else {

      throw new Error(
        "This tool will be enabled in next update."
      );
    }

    setStep(2);

    progressBar.style.width = "100%";

    resultText.textContent =
      "Processing completed successfully.";

    resultBox.classList.remove("hidden");

  }

  catch (error) {

  console.error(error);

  alert(error.message);

  resultText.textContent = error.message;

  resultBox.classList.remove("hidden");

  }

})();
    
  });
}


if (document.getElementById("progressBar")) {
  resetSteps();
}
