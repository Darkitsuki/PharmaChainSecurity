using PharmaSecure.Domain.Entities;

namespace PharmaSecure.Application.Interfaces;

public interface IInvoicePersistence
{
    Task<decimal?> GetDrugPriceAsync(string drugId, CancellationToken cancellationToken = default);

    Task SaveAsync(
        Invoice invoice,
        DigitalSignature digitalSignature,
        CancellationToken cancellationToken = default);
}