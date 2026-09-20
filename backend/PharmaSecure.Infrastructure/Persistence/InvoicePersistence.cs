using System.Data;
using Oracle.ManagedDataAccess.Client;
using PharmaSecure.Application.Interfaces;
using PharmaSecure.Domain.Entities;

namespace PharmaSecure.Infrastructure.Persistence;

public sealed class InvoicePersistence : IInvoicePersistence
{
    private readonly IUnitOfWork unitOfWork;

    public InvoicePersistence(IUnitOfWork unitOfWork)
    {
        this.unitOfWork = unitOfWork;
    }

    public async Task<decimal?> GetDrugPriceAsync(string drugId, CancellationToken cancellationToken = default)
    {
        await using var command = CreateCommand("SELECT Price FROM DRUGS WHERE id = :drugId");
        command.Parameters.Add("drugId", OracleDbType.Varchar2, 50).Value = drugId;
        var value = await command.ExecuteScalarAsync(cancellationToken);
        return value is null or DBNull ? null : Convert.ToDecimal(value, System.Globalization.CultureInfo.InvariantCulture);
    }

    public async Task SaveAsync(
        Invoice invoice,
        DigitalSignature digitalSignature,
        CancellationToken cancellationToken = default)
    {
        await using (var command = CreateCommand("""
            INSERT INTO INVOICES (id, InvoiceNo, CreatedDate, TotalAmount, BranchId, CashierId)
            VALUES (:id, :invoiceNo, :createdDate, :totalAmount, :branchId, :cashierId)
            """))
        {
            command.Parameters.Add("id", OracleDbType.Varchar2, 50).Value = invoice.Id;
            command.Parameters.Add("invoiceNo", OracleDbType.Varchar2, 50).Value = invoice.InvoiceNumber;
            command.Parameters.Add("createdDate", OracleDbType.TimeStamp).Value = invoice.CreatedDate;
            command.Parameters.Add("totalAmount", OracleDbType.Decimal).Value = invoice.TotalAmount;
            command.Parameters.Add("branchId", OracleDbType.Varchar2, 50).Value = invoice.BranchId;
            command.Parameters.Add("cashierId", OracleDbType.Varchar2, 50).Value = invoice.CashierId;
            await command.ExecuteNonQueryAsync(cancellationToken);
        }

        foreach (var item in invoice.Items)
        {
            await using var command = CreateCommand("""
                INSERT INTO INVOICE_ITEMS (InvoiceId, DrugId, BatchId, Quantity, UnitPrice, SubTotal)
                VALUES (:invoiceId, :drugId, :batchId, :quantity, :unitPrice, :subTotal)
                """);
            command.Parameters.Add("invoiceId", OracleDbType.Varchar2, 50).Value = item.InvoiceId;
            command.Parameters.Add("drugId", OracleDbType.Varchar2, 50).Value = item.DrugId;
            command.Parameters.Add("batchId", OracleDbType.Varchar2, 50).Value = item.BatchId;
            command.Parameters.Add("quantity", OracleDbType.Int32).Value = item.Quantity;
            command.Parameters.Add("unitPrice", OracleDbType.Decimal).Value = item.UnitPrice;
            command.Parameters.Add("subTotal", OracleDbType.Decimal).Value = item.SubTotal;
            await command.ExecuteNonQueryAsync(cancellationToken);
        }

        await using (var command = CreateCommand("""
            INSERT INTO DIGITAL_SIGNATURES (id, InvoiceId, HashValue_SHA256, SignatureData, CertSerial, SignedAt)
            VALUES (:id, :invoiceId, :hashValue, :signatureData, :certSerial, :signedAt)
            """))
        {
            command.Parameters.Add("id", OracleDbType.Varchar2, 50).Value = digitalSignature.Id;
            command.Parameters.Add("invoiceId", OracleDbType.Varchar2, 50).Value = digitalSignature.InvoiceId;
            command.Parameters.Add("hashValue", OracleDbType.Varchar2, 255).Value = digitalSignature.HashValueSha256;
            command.Parameters.Add("signatureData", OracleDbType.Clob).Value = digitalSignature.SignatureData;
            command.Parameters.Add("certSerial", OracleDbType.Varchar2, 100).Value = digitalSignature.CertificateSerial;
            command.Parameters.Add("signedAt", OracleDbType.TimeStamp).Value = digitalSignature.SignedAt;
            await command.ExecuteNonQueryAsync(cancellationToken);
        }
    }

    private OracleCommand CreateCommand(string commandText)
    {
        if (unitOfWork.Transaction is not OracleTransaction transaction)
            throw new InvalidOperationException("Invoice persistence requires an active Oracle transaction.");

        var command = (OracleCommand)unitOfWork.Connection.CreateCommand();
        command.Transaction = transaction;
        command.BindByName = true;
        command.CommandText = commandText;
        return command;
    }
}