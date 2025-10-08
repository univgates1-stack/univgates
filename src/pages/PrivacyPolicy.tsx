import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useTranslation } from "react-i18next";

const PrivacyPolicy = () => {
  const { i18n } = useTranslation();
  const locale = i18n.language?.toLowerCase().startsWith("tr") ? "tr" : "en";
  const Content = locale === "tr" ? TurkishPrivacy : EnglishPrivacy;

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Header />
      <main className="flex-1 pt-32 pb-16">
        <section className="container mx-auto px-6">
          <article className="max-w-4xl mx-auto space-y-10">
            <Content />
          </article>
        </section>
      </main>
      <Footer />
    </div>
  );
};

const EnglishPrivacy = () => (
  <>
    <header className="space-y-4 text-center">
      <h1 className="text-4xl font-bold">Privacy Policy</h1>
      <p className="text-muted-foreground">
        This Privacy Policy explains how UnivGates collects, uses, shares, and protects personal
        data when you access our website, mobile applications, and services.
      </p>
    </header>

    <section className="space-y-4">
      <h2 className="text-2xl font-semibold">Information We Collect</h2>
      <p>
        We request certain personal information—including your name, age, and email address—to
        provide better service within the Platform. Data collected through the Platform is used
        strictly for delivering UnivGates services. In addition to personal data, we analyze and
        store statistical information about user interactions with the Platform.
      </p>
    </section>

    <section className="space-y-4">
      <h2 className="text-2xl font-semibold">How We Use and Share Information</h2>
      <ul className="space-y-3 list-disc pl-6">
        <li>
          Contact details submitted via membership forms may be shared with relevant third parties
          when you request to be contacted.
        </li>
        <li>
          Information obtained through Scouting or similar applications may be shared with
          stakeholder institutions and organizations.
        </li>
        <li>
          UnivGates never uses or sells information gathered via membership forms for purposes
          outside its activities without your consent.
        </li>
      </ul>
    </section>

    <section className="space-y-4">
      <h2 className="text-2xl font-semibold">Usage Data and Analytics</h2>
      <p>
        We keep statistical records about the use of our website and mobile application, including
        IP addresses, internet service provider information, browser characteristics, operating
        system details, and entry/exit pages. This data is used only for statistical purposes and is
        not associated with personally identifiable information. Third-party advertisements,
        promotions, or announcements displayed on the Platform may contain cookies.
      </p>
      <p>
        The Platform may include links to external websites. UnivGates is not responsible for the
        content or privacy practices of those sites; such links are provided solely as references.
      </p>
    </section>

    <section className="space-y-4">
      <h2 className="text-2xl font-semibold">Cookies and Tracking Technologies</h2>
      <p>
        Cookies and similar technologies may be used to enhance user experience, measure
        performance, and support business development. Service providers such as Countly, Google
        Analytics, Google Tag Manager, and Facebook help us analyze aggregated usage trends.
      </p>
      <p>
        You can review our detailed{" "}
        <a href="/cookies" className="underline">
          Cookie Policy
        </a>{" "}
        to learn more about how these technologies operate and how you can manage your cookie
        preferences.
      </p>
    </section>

    <section className="space-y-4">
      <h2 className="text-2xl font-semibold">Personal Data Processing</h2>
      <p>
        By using the Platform, you consent to UnivGates collecting, storing, processing, and
        transferring personal data as required to deliver the services. Your data is encrypted and
        safeguarded in our systems. We utilize personal data to:
      </p>
      <ul className="space-y-3 list-disc pl-6">
        <li>Fulfill obligations set forth in this Privacy Policy and the User Agreement.</li>
        <li>Maintain records, run internal reporting, conduct analysis, and provide support.</li>
        <li>Measure business performance, track user engagement, and evaluate site performance.</li>
        <li>Introduce users to mentors and facilitate communication.</li>
        <li>
          Comply with legal requirements, court orders, or lawful requests, and protect UnivGates’
          rights.
        </li>
        <li>Monitor and improve our interactive products, operations, and overall service quality.</li>
      </ul>
      <p>
        By approving the User Agreement, you confirm that the information you share belongs to you
        and authorize UnivGates to use it in carrying out platform activities. You acknowledge that
        personal data may be transferred domestically and internationally to service providers as
        necessary.
      </p>
    </section>

    <section className="space-y-4">
      <h2 className="text-2xl font-semibold">Your Choices</h2>
      <p>
        You may update or request deletion of your information by contacting us at{" "}
        <a href="mailto:info@univgates.com" className="underline">
          info@univgates.com
        </a>
        . If you opt to discontinue services, you may revoke your consent; however, doing so may
        limit your ability to use certain features of the Platform.
      </p>
    </section>
  </>
);

const TurkishPrivacy = () => (
  <>
    <header className="space-y-4 text-center">
      <h1 className="text-4xl font-bold">Gizlilik Politikası</h1>
      <p className="text-muted-foreground">
        UnivGates, kişisel verilerinizi 6698 sayılı Kişisel Verilerin Korunması Kanunu ve ilgili
        mevzuata uygun olarak işler. Platformu kullanarak bu politikayı okuduğunuzu ve kabul
        ettiğinizi beyan edersiniz.
      </p>
    </header>

    <section className="space-y-4">
      <h2 className="text-2xl font-semibold">Kişisel Verilerin Toplanması ve Kullanımı</h2>
      <p>
        Platformda daha iyi hizmet sunabilmek amacıyla isim, yaş, e-posta adresi gibi kişisel
        bilgiler talep edilebilir. Toplanan veriler, UnivGates tarafından sunulan hizmetlerin yerine
        getirilmesi amacıyla kullanılır; ayrıca platform üzerinde gerçekleştirilen işlemlere ait
        istatistiksel veriler analiz edilir ve saklanır.
      </p>
    </section>

    <section className="space-y-4">
      <h2 className="text-2xl font-semibold">Bilgi Paylaşımı</h2>
      <ul className="space-y-3 list-disc pl-6">
        <li>
          Üyelik formları aracılığıyla iletilen iletişim bilgileri, kullanıcının talebi
          doğrultusunda ilgili üçüncü kişilerle paylaşılabilir.
        </li>
        <li>
          Scouting sayfası üzerinden yapılan başvurulardan elde edilen bilgiler, paydaş kurum ve
          kuruluşlarla paylaşılabilir.
        </li>
        <li>
          Üyelik formlarıyla iletilen bilgiler, kullanıcı izni olmaksızın faaliyet dışı hiçbir
          amaçla kullanılmaz veya satılmaz.
        </li>
      </ul>
    </section>

    <section className="space-y-4">
      <h2 className="text-2xl font-semibold">İstatistiksel Veriler ve Çerezler</h2>
      <p>
        UnivGates, web sitesi ve mobil uygulama kullanımına ilişkin istatistiksel kayıtlar tutar. Bu
        kayıtlar; IP adresi, internet servis sağlayıcısı, tarayıcı özellikleri, işletim sistemi ve
        siteye giriş-çıkış sayfaları gibi bilgileri içerir ve yalnızca istatistiksel amaçlarla
        kullanılır. Bilgiler, kullanıcıların mahremiyetini ihlal etmeyecek şekilde anonim tutulur.
      </p>
      <p>
        Platformda üçüncü kişilere ait reklam, tanıtım ve açıklamalar yayınlanabilir; bu içerikler
        çerez içerebilir. Ayrıca farklı internet adreslerine verilen bağlantılar, yalnızca referans
        kolaylığı sağlamak amacı taşır ve bu sitelerin içeriklerinden veya gizlilik ilkelerinden
        UnivGates sorumlu değildir.
      </p>
      <p>
        Çerezler, kullanıcı deneyimini artırmak amacıyla kullanılabilir. Tarayıcı ayarlarınız
        aracılığıyla çerezleri reddedebilir, kaydedilmeden önce uyarı alabilir veya daha önce
        kaydedilen çerezleri silebilirsiniz. UnivGates, iş geliştirme, yazılım geliştirme, ölçme ve
        değerlendirme faaliyetleri için aşağıdaki hizmet sağlayıcıların çözümlerinden
        yararlanabilir:
      </p>
      <ul className="space-y-2 list-disc pl-6">
        <li>
          <a
            href="https://count.ly/legal/terms-of-service"
            className="underline"
            target="_blank"
            rel="noreferrer"
          >
            Countly
          </a>
        </li>
        <li>
          <a
            href="https://www.google.com/analytics/terms/tr.html"
            className="underline"
            target="_blank"
            rel="noreferrer"
          >
            Google Analytics
          </a>
        </li>
        <li>
          <a
            href="https://www.google.com/analytics/terms/tag-manager/"
            className="underline"
            target="_blank"
            rel="noreferrer"
          >
            Google Tag Manager
          </a>
        </li>
        <li>
          <a
            href="https://www.facebook.com/policies"
            className="underline"
            target="_blank"
            rel="noreferrer"
          >
            Facebook
          </a>
        </li>
      </ul>
    </section>

    <section className="space-y-4">
      <h2 className="text-2xl font-semibold">Kişisel Verilerin İşlenmesi ve Aktarımı</h2>
      <p>
        Hizmetleri sunabilmek için kişisel verilerin toplanması, saklanması, kullanılması,
        işlenmesi ve aktarılması gerekir. Platformu kullanmaya devam ederek bu işlemlere muvafakat
        etmiş sayılırsınız. Kişisel verileriniz şifrelenecek ve sistemlerimizde korunacaktır.
      </p>
      <p>Verileriniz aşağıdaki amaçlarla işlenebilir ve paylaşılabilir:</p>
      <ul className="space-y-2 list-disc pl-6">
        <li>Gizlilik Politikası ve Kullanıcı Sözleşmesinde düzenlenen yükümlülüklerin yerine getirilmesi.</li>
        <li>Kayıt tutma, şirket içi raporlama ve analiz ile destek süreçlerinin yürütülmesi.</li>
        <li>Veri analizi ve ölçüm yöntemleriyle iş performansının, kullanıcı sayısının ve platform kanallarının değerlendirilmesi.</li>
        <li>Kullanıcıların mentörlerle eşleştirilmesi ve tanıtılması.</li>
        <li>Kanunen zorunlu hallerde veya UnivGates’in haklarını korumak için resmi makamlara bilgi verilmesi.</li>
        <li>İnteraktif varlıkların takibi, geliştirilmesi ve kullanıcı deneyiminin iyileştirilmesi.</li>
        <li>Ticari faaliyetlerimizin değerlendirilmesi, işletilmesi ve geliştirilmesi.</li>
      </ul>
      <p>
        Kullanıcı, paylaştığı bilgilerin kendisine ait olduğunu ve bu bilgilerin UnivGates
        faaliyetlerinin yürütülmesi amacıyla kullanılmasına onay verdiğini kabul eder. Kişisel
        veriler, sözleşmede ve Aydınlatma Metninde belirtilen durumlarda yurt içi ve yurt dışındaki
        hizmet sağlayıcılara aktarılabilir.
      </p>
    </section>

    <section className="space-y-4">
      <h2 className="text-2xl font-semibold">Haklarınız ve İletişim</h2>
      <p>
        Kişisel verilerinize ilişkin bilgi talep etmek, güncelleme veya silme başvurusunda bulunmak
        isterseniz{" "}
        <a href="mailto:info@univgates.com" className="underline">
          info@univgates.com
        </a>{" "}
        adresine yazabilirsiniz. Başvurular, ilgili mevzuat çerçevesinde mümkün olan en kısa sürede
        yanıtlanacaktır.
      </p>
    </section>
  </>
);

export default PrivacyPolicy;
