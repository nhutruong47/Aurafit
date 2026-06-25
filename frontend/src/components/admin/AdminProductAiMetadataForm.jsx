import { Panel } from './AdminDashboardShared';

function TextInput({ label, name, value, onChange, multiline = false, placeholder = '' }) {
  return (
    <label className="block">
      <span className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.16em] text-[#777777]">{label}</span>
      {multiline ? (
        <textarea
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="min-h-24 w-full resize-none border border-[#d7d2c8] bg-[#fafaf8] px-3 py-3 text-sm outline-none focus:border-[#7f7041]"
        />
      ) : (
        <input
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="w-full border border-[#d7d2c8] bg-[#fafaf8] px-3 py-3 text-sm outline-none focus:border-[#7f7041]"
        />
      )}
    </label>
  );
}

export default function AdminProductAiMetadataForm({
  selectedProduct,
  metadataForm,
  metadataStatus,
  metadataMessage,
  metadataError,
  isLoadingMetadata,
  isSavingMetadata,
  onFieldChange,
  onSubmit,
}) {
  return (
    <Panel
      title="AI Metadata"
      action={selectedProduct ? `Dang chinh cho #${selectedProduct.id}` : 'Chon san pham ben trai'}
    >
      {selectedProduct ? (
        <>
          <p className="mb-4 text-sm leading-6 text-[#5f5e5e]">
            San pham dang duoc gan metadata AI: <strong>{selectedProduct.name}</strong>
          </p>

          <form
            className="grid gap-4"
            onSubmit={(event) => {
              event.preventDefault();
              onSubmit?.();
            }}
          >
            <div className="grid gap-4 md:grid-cols-2">
              <TextInput label="Style tags" name="styleTags" value={metadataForm.styleTags} onChange={onFieldChange} placeholder="vintage, luxury, minimal" />
              <TextInput label="Occasion tags" name="occasionTags" value={metadataForm.occasionTags} onChange={onFieldChange} placeholder="wedding, gala, event" />
              <TextInput label="Trend tags" name="trendTags" value={metadataForm.trendTags} onChange={onFieldChange} placeholder="old money, quiet luxury" />
              <TextInput label="Size tags" name="sizeTags" value={metadataForm.sizeTags} onChange={onFieldChange} placeholder="S, M, L" />
              <TextInput label="Color tags" name="colorTags" value={metadataForm.colorTags} onChange={onFieldChange} placeholder="champagne, black, pastel" />
              <TextInput label="Season tags" name="seasonTags" value={metadataForm.seasonTags} onChange={onFieldChange} placeholder="spring, summer" />
              <TextInput label="Gender tags" name="genderTags" value={metadataForm.genderTags} onChange={onFieldChange} placeholder="female, unisex" />
              <TextInput label="Material tags" name="materialTags" value={metadataForm.materialTags} onChange={onFieldChange} placeholder="silk, satin, lace" />
              <TextInput label="Fit tags" name="fitTags" value={metadataForm.fitTags} onChange={onFieldChange} placeholder="slim fit, oversized" />
              <TextInput label="Budget tier" name="budgetTier" value={metadataForm.budgetTier} onChange={onFieldChange} placeholder="premium" />
              <TextInput label="Silhouette" name="silhouette" value={metadataForm.silhouette} onChange={onFieldChange} placeholder="A-line" />
              <TextInput label="Formality level" name="formalityLevel" value={metadataForm.formalityLevel} onChange={onFieldChange} placeholder="formal" />
            </div>

            <TextInput
              label="Admin notes"
              name="adminNotes"
              value={metadataForm.adminNotes}
              onChange={onFieldChange}
              multiline
              placeholder="Mo ta them ve context, trend, tone styling..."
            />

            {metadataStatus && (
              <div className="border border-[#ebe7df] bg-[#fafaf8] p-4 text-sm text-[#5f5e5e]">
                <p>
                  Embedding status: <strong>{metadataStatus.embeddingStatus || 'N/A'}</strong>
                </p>
                {metadataStatus.embeddingModel && (
                  <p className="mt-1">
                    Embedding model: <strong>{metadataStatus.embeddingModel}</strong>
                  </p>
                )}
                {metadataStatus.searchableText && (
                  <p className="mt-3 whitespace-pre-line border-t border-[#e5e0d7] pt-3 text-xs leading-6">
                    {metadataStatus.searchableText}
                  </p>
                )}
              </div>
            )}

            {metadataMessage && <p className="border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">{metadataMessage}</p>}
            {metadataError && <p className="border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{metadataError}</p>}

            <button
              disabled={isSavingMetadata || isLoadingMetadata}
              className="w-full bg-black py-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-[#7f7041] disabled:bg-[#777777]"
            >
              {isLoadingMetadata ? 'Dang tai metadata...' : isSavingMetadata ? 'Dang luu metadata...' : 'Luu AI metadata'}
            </button>
          </form>
        </>
      ) : (
        <p className="text-sm leading-6 text-[#5f5e5e]">
          Chon mot san pham trong danh sach va bam "Sua san pham" de mo form metadata AI.
        </p>
      )}
    </Panel>
  );
}
