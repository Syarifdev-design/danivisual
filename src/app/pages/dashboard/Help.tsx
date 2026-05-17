import { useState } from "react";
import { MessageCircle, FileText, CreditCard, Download, ChevronDown } from "lucide-react";
import { Link } from "react-router";

export default function Help() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const faqs = [
    {
      question: "Bagaimana cara memilih paket?",
      answer:
        'Klik menu "Choose Package" di sidebar, pilih kategori layanan (Wedding, Prewed Studio, Prewed Outdoor, atau Event), lalu pilih paket yang sesuai dengan kebutuhan Anda.',
    },
    {
      question: "Apakah bisa mengganti paket setelah checkout?",
      answer:
        "Perubahan paket dapat dilakukan sebelum hari H dengan menghubungi admin. Namun, perubahan setelah pembayaran DP mungkin dikenakan biaya administrasi.",
    },
    {
      question: "Bagaimana cara upload bukti pembayaran?",
      answer:
        'Masuk ke menu "Payment Status" atau pada step Pembayaran di Checkout. Upload foto bukti transfer, isi nama pengirim, tanggal, dan nominal transfer. Admin akan memverifikasi dalam 1x24 jam.',
    },
    {
      question: "Kapan file sementara dikirim?",
      answer:
        "File sementara berupa momen penting, pose utama, dan highlight acara akan dikirim maksimal H+2 setelah acara selesai.",
    },
    {
      question: "Bagaimana cara memilih foto selection?",
      answer:
        'Setelah file backup selesai, Anda akan mendapat notifikasi untuk foto selection. Buka menu "Progress" dan pilih foto yang ingin diedit, atau serahkan pilihan ke tim Danivisual. Batas waktu maksimal 24 jam.',
    },
    {
      question: "Bagaimana cara download file Google Drive?",
      answer:
        'Masuk ke menu "Download File" setelah proses editing selesai. Klik link Google Drive yang tersedia untuk membuka folder dan download file Anda.',
    },
    {
      question: "Kenapa delivery terkunci?",
      answer:
        "Delivery terkunci karena Anda belum mengisi form kritik, saran, dan penilaian. Form ini wajib diisi sebelum tim Danivisual melanjutkan proses pengiriman album.",
    },
    {
      question: "Bagaimana cara menghubungi admin?",
      answer:
        'Klik tombol "Chat Admin" di halaman Help, atau langsung chat via WhatsApp ke +62 123 456 789. Admin siap membantu Anda dari Senin-Sabtu, 09:00-18:00 WIB.',
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl mb-2" style={{ fontFamily: "var(--font-heading)" }}>
          Butuh Bantuan?
        </h1>
        <p className="text-foreground-secondary">
          Tim Danivisual siap membantu Anda dalam proses booking, pembayaran, progress album, dan
          download file.
        </p>
      </div>

      {/* Help Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <a
          href="https://wa.me/6282337279636"
          target="_blank"
          rel="noopener noreferrer"
          className="bg-white border border-border-line rounded-sm p-6 hover:shadow-lg transition-all"
        >
          <MessageCircle size={32} className="text-premium-beige mb-4" />
          <h3 className="text-lg font-medium mb-2">Chat Admin</h3>
          <p className="text-sm text-foreground-secondary">
            Hubungi admin untuk bantuan cepat
          </p>
        </a>

        <div className="bg-white border border-border-line rounded-sm p-6 hover:shadow-lg transition-all cursor-pointer">
          <FileText size={32} className="text-premium-beige mb-4" />
          <h3 className="text-lg font-medium mb-2">Panduan Checkout</h3>
          <p className="text-sm text-foreground-secondary">
            Cara memilih paket dan checkout
          </p>
        </div>

        <Link
          to="/dashboard/payment-status"
          className="bg-white border border-border-line rounded-sm p-6 hover:shadow-lg transition-all"
        >
          <CreditCard size={32} className="text-premium-beige mb-4" />
          <h3 className="text-lg font-medium mb-2">Bantuan Pembayaran</h3>
          <p className="text-sm text-foreground-secondary">
            Bantuan DP, pelunasan, dan upload bukti
          </p>
        </Link>

        <Link
          to="/dashboard/download-file"
          className="bg-white border border-border-line rounded-sm p-6 hover:shadow-lg transition-all"
        >
          <Download size={32} className="text-premium-beige mb-4" />
          <h3 className="text-lg font-medium mb-2">Bantuan Album</h3>
          <p className="text-sm text-foreground-secondary">
            Bantuan album dan download file
          </p>
        </Link>
      </div>

      {/* FAQ Accordion */}
      <div className="bg-white border border-border-line rounded-sm p-8 mb-8">
        <h2 className="text-2xl mb-6" style={{ fontFamily: "var(--font-heading)" }}>
          Frequently Asked Questions
        </h2>
        <div className="space-y-3">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="border border-border-line rounded-sm overflow-hidden"
            >
              <button
                onClick={() => setOpenFaq(openFaq === index ? null : index)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-background-soft transition"
              >
                <span className="font-medium">{faq.question}</span>
                <ChevronDown
                  size={20}
                  className={`transition-transform ${openFaq === index ? "rotate-180" : ""}`}
                />
              </button>
              {openFaq === index && (
                <div className="px-4 pb-4">
                  <p className="text-sm text-foreground-secondary leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Contact Form */}
      <div className="bg-white border border-border-line rounded-sm p-8">
        <h2 className="text-2xl mb-6" style={{ fontFamily: "var(--font-heading)" }}>
          Kirim Pesan ke Admin
        </h2>
        <form className="space-y-4">
          <div>
            <label className="block text-sm mb-2">Topik Bantuan</label>
            <select className="w-full px-4 py-3 border border-border-line rounded-sm focus:outline-none focus:ring-1 focus:ring-premium-beige">
              <option>Pilih topik</option>
              <option>Checkout & Booking</option>
              <option>Pembayaran</option>
              <option>Progress Album</option>
              <option>Download File</option>
              <option>Lainnya</option>
            </select>
          </div>
          <div>
            <label className="block text-sm mb-2">Pesan</label>
            <textarea
              rows={4}
              placeholder="Tuliskan pertanyaan atau masalah yang Anda alami..."
              className="w-full px-4 py-3 border border-border-line rounded-sm focus:outline-none focus:ring-1 focus:ring-premium-beige"
            ></textarea>
          </div>
          <div>
            <label className="block text-sm mb-2">Upload File (opsional)</label>
            <input
              type="file"
              className="w-full px-4 py-3 border border-border-line rounded-sm focus:outline-none focus:ring-1 focus:ring-premium-beige"
            />
          </div>
          <button
            type="submit"
            className="px-6 py-3 bg-dark-premium text-white hover:bg-dark-premium/90 transition-all rounded-sm text-sm"
          >
            Kirim Pesan
          </button>
        </form>
      </div>

      {/* Sticky Quick Actions */}
      <div className="fixed bottom-6 right-6 flex flex-col gap-3 z-50">
        <a
          href="https://wa.me/6282337279636"
          target="_blank"
          rel="noopener noreferrer"
          className="bg-dark-premium text-white px-4 py-2 rounded-full shadow-lg hover:bg-dark-premium/90 transition text-sm flex items-center gap-2"
        >
          <MessageCircle size={18} />
          <span>Chat Admin</span>
        </a>
        <Link
          to="/dashboard"
          className="bg-white border border-border-line text-foreground px-4 py-2 rounded-full shadow-lg hover:bg-background-soft transition text-sm"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
