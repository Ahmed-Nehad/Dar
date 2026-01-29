import writeXlsxFile from 'write-excel-file';

export const exportToExcel = async (data: any[], schema: any[], fileName: string) => {
  try {
    const blob = await writeXlsxFile(data, {
      schema,
      fileName: `${fileName}.xlsx`,
      // Optional: Set font family and size for the whole sheet
      fontFamily: 'Sakkal Majalla',
      fontSize: 12,
      headerStyle: {
        backgroundColor: '#eeeeee',
        fontWeight: 'bold',
        align: 'center',
        borderStyle: 'thin' // Adds grid lines to headers
      },
    });
    
    // The library handles the download automatically in most cases, 
    // but returning the blob allows manual handling if needed.
    return blob;
  } catch (error) {
    console.error("Export failed:", error);
    alert("فشل تصدير الملف");
  }
};