import { useState } from 'react';

const emptyForm = {
  prompt: '',
  styleTags: '',
  occasionTags: '',
  colorTags: '',
  sizeTags: '',
  genderTags: '',
  budgetMin: '',
  budgetMax: '',
};

const parseTags = (value) =>
  String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

export default function AiStylistBox({ title = 'AI Stylist', description, isLoading = false, onSubmit }) {
  const [form, setForm] = useState(emptyForm);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit?.({
      prompt: form.prompt,
      styleTags: parseTags(form.styleTags),
      occasionTags: parseTags(form.occasionTags),
      colorTags: parseTags(form.colorTags),
      sizeTags: parseTags(form.sizeTags),
      genderTags: parseTags(form.genderTags),
      budgetMin: form.budgetMin ? Number(form.budgetMin) : null,
      budgetMax: form.budgetMax ? Number(form.budgetMax) : null,
    });
  };

  return (
    <section className="border border-[#d7d2c8] bg-[#fdfdfb] p-6">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#99854e]">{title}</p>
          {description && <p className="mt-2 max-w-2xl text-sm leading-6 text-[#5f5e5e]">{description}</p>}
        </div>
        <span className="material-symbols-outlined text-3xl text-[#99854e]">auto_awesome</span>
      </div>

      <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
        <label className="md:col-span-2">
          <span className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.16em] text-[#777777]">Nhu cau hien tai</span>
          <textarea
            name="prompt"
            value={form.prompt}
            onChange={handleChange}
            rows={3}
            placeholder="Vi du: toi can mot outfit sang trong cho tiec cuoi ngoai troi, tone be va vang champagne"
            className="w-full resize-none border border-[#d7d2c8] bg-white px-3 py-3 text-sm outline-none focus:border-[#7f7041]"
          />
        </label>

        {[
          ['styleTags', 'Phong cach'],
          ['occasionTags', 'Dip su dung'],
          ['colorTags', 'Mau sac'],
          ['sizeTags', 'Size'],
          ['genderTags', 'Gioi tinh / presentation'],
        ].map(([name, label]) => (
          <label key={name}>
            <span className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.16em] text-[#777777]">{label}</span>
            <input
              name={name}
              value={form[name]}
              onChange={handleChange}
              placeholder="Nhap cach nhau boi dau phay"
              className="w-full border border-[#d7d2c8] bg-white px-3 py-3 text-sm outline-none focus:border-[#7f7041]"
            />
          </label>
        ))}

        <div className="grid grid-cols-2 gap-3">
          <label>
            <span className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.16em] text-[#777777]">Budget min</span>
            <input
              name="budgetMin"
              type="number"
              value={form.budgetMin}
              onChange={handleChange}
              className="w-full border border-[#d7d2c8] bg-white px-3 py-3 text-sm outline-none focus:border-[#7f7041]"
            />
          </label>
          <label>
            <span className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.16em] text-[#777777]">Budget max</span>
            <input
              name="budgetMax"
              type="number"
              value={form.budgetMax}
              onChange={handleChange}
              className="w-full border border-[#d7d2c8] bg-white px-3 py-3 text-sm outline-none focus:border-[#7f7041]"
            />
          </label>
        </div>

        <div className="md:col-span-2">
          <button
            disabled={isLoading}
            className="w-full bg-black px-4 py-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-[#7f7041] disabled:bg-[#777777]"
          >
            {isLoading ? 'Dang goi y...' : 'Nhan goi y tu AI'}
          </button>
        </div>
      </form>
    </section>
  );
}
