/**
 * Service for generating PDF invoices using jsPDF
 */
export function generateInvoice(order) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Helper for easier text placement
    const text = (str, x, y, options = {}) => {
        if (options.bold) doc.setFont("helvetica", "bold");
        else doc.setFont("helvetica", "normal");

        if (options.align === 'right') {
            doc.text(str, x, y, { align: 'right' });
        } else {
            doc.text(str, x, y);
        }
    };

    // Header
    doc.setFontSize(22);
    text("STORE Shop.co", 20, 30, { bold: true });

    doc.setFontSize(10);
    text("Date: " + new Date(order.orderDate).toLocaleDateString(), 190, 30, { align: 'right' });
    text("Order ID: #" + order.id, 190, 35, { align: 'right' });

    // Customer Info
    doc.setFontSize(12);
    text("Bill To:", 20, 50, { bold: true });
    text(order.name, 20, 55);
    text(order.address, 20, 60);
    text("Phone: " + order.phone, 20, 65);

    // Table Header
    doc.setFillColor(245, 245, 245);
    doc.rect(20, 75, 170, 10, 'F');
    doc.setFontSize(10);
    text("Item Description", 25, 81.5, { bold: true });
    text("Qty", 130, 81.5, { bold: true });
    text("Price", 150, 81.5, { bold: true });
    text("Amount", 185, 81.5, { bold: true, align: 'right' });

    // Table Content
    let y = 92;
    order.orderItems.forEach((item, index) => {
        text(item.name + (item.size ? ` (${item.size})` : ''), 25, y);
        text(item.qty.toString(), 130, y);
        text(`$${item.price.toFixed(2)}`, 150, y);
        text(`$${(item.price * item.qty).toFixed(2)}`, 185, y, { align: 'right' });
        y += 10;

        // Check for page break if needed (simple check)
        if (y > 270) {
            doc.addPage();
            y = 20;
        }
    });

    // Divider
    doc.setDrawColor(200, 200, 200);
    doc.line(20, y + 2, 190, y + 2);

    // Totals
    y += 12;
    doc.setFontSize(12);
    text("Total Amount:", 150, y, { bold: true, align: 'right' });
    text(`$${order.orderTotal.toFixed(2)}`, 185, y, { bold: true, align: 'right' });

    // Footer
    doc.setFontSize(10);
    doc.setTextColor(150, 150, 150);
    text("Thank you for shopping with us!", 105, 280, { align: 'center' });

    // Save PDF
    doc.save(`Invoice_${order.id}.pdf`);
}
