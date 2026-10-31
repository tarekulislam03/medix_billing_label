import html2canvas from 'html2canvas';

/**
 * Capture an HTML DOM element and return a crisp PNG data URL
 * @param {HTMLElement} element 
 * @param {number} scale 
 * @returns {Promise<string>}
 */
export async function captureElementToImage(element, scale = 2) {
  if (!element) throw new Error('Target element not found');

  const canvas = await html2canvas(element, {
    scale,
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff',
    windowWidth: 320, // 80mm width standard viewport
  });

  return canvas.toDataURL('image/png');
}

/**
 * Print one or more image data URLs using an isolated 80mm print iframe
 * @param {string[]} imageUrls Array of data URLs or image URLs
 */
export function printImagesOn80mmRoll(imageUrls = []) {
  if (!imageUrls.length) return;

  // Remove existing print iframe if any
  const existingIframe = document.getElementById('medix-80mm-print-iframe');
  if (existingIframe) {
    existingIframe.remove();
  }

  const iframe = document.createElement('iframe');
  iframe.id = 'medix-80mm-print-iframe';
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.style.visibility = 'hidden';

  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) {
    console.error('Cannot access print iframe document');
    window.print();
    return;
  }

  const imagesHtml = imageUrls
    .map(
      (url, index) => `
      <div class="${index < imageUrls.length - 1 ? 'page-break' : ''}" style="margin: 0; padding: 0;">
        <img src="${url}" class="thermal-print-img" alt="Medix 80mm Document" />
      </div>
    `
    )
    .join('');

  const iframeContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Medix 80mm Print</title>
        <style>
          @page {
            size: 80mm auto;
            margin: 0mm;
          }
          * {
            box-sizing: border-box;
          }
          html, body {
            width: 80mm;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff;
            color: #000000;
            font-family: monospace;
          }
          .thermal-print-img {
            width: 76mm;
            max-width: 76mm;
            height: auto;
            display: block;
            margin: 0 auto;
            image-rendering: -webkit-optimize-contrast;
            image-rendering: crisp-edges;
            image-rendering: pixelated;
          }
          .page-break {
            page-break-after: always;
            break-after: page;
          }
          @media print {
            body {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
          }
        </style>
      </head>
      <body>
        ${imagesHtml}
      </body>
    </html>
  `;

  doc.open();
  doc.write(iframeContent);
  doc.close();

  // Wait for images in iframe to fully load before printing
  const images = doc.querySelectorAll('img');
  let loadedCount = 0;

  const triggerPrint = () => {
    setTimeout(() => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } catch (err) {
        console.error('Iframe print error, falling back to window.print()', err);
        window.print();
      }
    }, 150);
  };

  if (images.length === 0) {
    triggerPrint();
    return;
  }

  images.forEach((img) => {
    if (img.complete) {
      loadedCount++;
      if (loadedCount === images.length) triggerPrint();
    } else {
      img.onload = () => {
        loadedCount++;
        if (loadedCount === images.length) triggerPrint();
      };
      img.onerror = () => {
        loadedCount++;
        if (loadedCount === images.length) triggerPrint();
      };
    }
  });
}
