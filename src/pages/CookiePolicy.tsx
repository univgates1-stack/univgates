import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useTranslation } from "react-i18next";

const CookiePolicy = () => {
  const { i18n } = useTranslation();
  const locale = i18n.language?.toLowerCase().startsWith("tr") ? "tr" : "en";
  const Content = locale === "tr" ? TurkishCookiePolicy : EnglishCookiePolicy;

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

const EnglishCookiePolicy = () => (
  <>
    <header className="space-y-4 text-center">
      <h1 className="text-4xl font-bold">Cookie Policy</h1>
      <p className="text-muted-foreground">
        This Cookie Policy explains how UnivGates uses cookies and similar technologies on our
        website and mobile applications.
      </p>
    </header>

    <section className="space-y-4">
      <h2 className="text-2xl font-semibold">What Are Cookies?</h2>
      <p>
        Cookies are small text files placed on your device by websites you visit. They do not
        contain personal information, but they help store session data and recognize you based on
        your usage habits to provide similar services tailored to your interests.
      </p>
    </section>

    <section className="space-y-4">
      <h2 className="text-2xl font-semibold">How We Use Cookies</h2>
      <p>
        Cookies are essential for ensuring the functionality of the UnivGates platform,
        personalizing published content and advertisements, analyzing traffic, and understanding how
        users interact with our services. By clicking “Accept all cookies,” you permit us to utilize
        these technologies for the purposes described.
      </p>
    </section>

    <section className="space-y-4">
      <h2 className="text-2xl font-semibold">Types of Cookies We Use</h2>
      <p>
        We may use first-party and third-party cookies, web beacons, and similar technologies to
        deliver and enhance our services. Third-party providers we collaborate with include:
      </p>
      <ul className="space-y-3 list-disc pl-6">
        <li>Google Analytics</li>
        <li>Google Tag Manager</li>
        <li>Facebook</li>
        <li>Countly</li>
      </ul>
      <p>
        We may also use country information to keep pricing and currency details current and to
        improve the overall user experience.
      </p>
    </section>

    <section className="space-y-4">
      <h2 className="text-2xl font-semibold">Managing Cookies</h2>
      <p>
        If your browser supports it, you can manage cookies through browser settings. Options
        typically include rejecting all cookies, receiving notifications before cookies are stored,
        accepting cookies from specific websites, and deleting previously stored cookies.
      </p>
      <p>
        You may opt out of third-party cookies by visiting their respective websites. Please note
        that disabling cookies may prevent you from using some or all features of the UnivGates
        platform.
      </p>
    </section>

    <section className="space-y-4">
      <h2 className="text-2xl font-semibold">Contact Us</h2>
      <p>
        For questions about this Cookie Policy, contact us at{" "}
        <a href="mailto:info@univgates.com" className="underline">
          info@univgates.com
        </a>
        .
      </p>
    </section>
  </>
);

const TurkishCookiePolicy = () => (
  <>
    <header className="space-y-4 text-center">
      <h1 className="text-4xl font-bold">Çerez Politikası</h1>
      <p className="text-muted-foreground">
        UnivGates olarak çerez politikamız, gizlilik politikamızın ayrılmaz bir parçasıdır. Bu
        metin, sitemizde kullanılan çerezler ve tercihlerinizi nasıl yönetebileceğiniz hakkında
        bilgi sunar.
      </p>
    </header>

    <section className="space-y-4">
      <h2 className="text-2xl font-semibold">Çerez Nedir?</h2>
      <p>
        Çerezler (cookies), ziyaret ettiğiniz internet sitelerince tarayıcınıza yerleştirilen basit
        metin dosyalarıdır. Herhangi bir kişisel bilgi içermezler; kimliğinizi doğrudan tespit
        etmezler. Oturum bilgileri ve benzeri verileri anonim biçimde saklayarak kullanım
        alışkanlıklarınıza göre sizi tanımamıza ve benzer hizmetleri sunmamıza yardımcı olurlar.
      </p>
    </section>

    <section className="space-y-4">
      <h2 className="text-2xl font-semibold">Çerezleri Neden Kullanıyoruz?</h2>
      <p>
        univgates.com ve mobil uygulamalarımızın işlevselliğini sağlamak, yayınlanan içerik ve
        reklamları kişiselleştirmek, trafiği analiz etmek ve platformun nasıl kullanıldığını daha
        iyi anlamak için çerezlerden yararlanıyoruz. Platformda “Tüm çerezleri kabul et” seçeneğine
        tıkladığınızda bu kullanımı kabul etmiş sayılırsınız.
      </p>
    </section>

    <section className="space-y-4">
      <h2 className="text-2xl font-semibold">Kullandığımız Çerez Türleri</h2>
      <p>
        Hizmetlerimizi geliştirmek ve kullanıcı deneyimini iyileştirmek için hem birinci taraf
        çerezleri hem de üçüncü taraf çerezleri kullanabiliriz. Yararlanılan hizmet sağlayıcılar
        arasında şunlar bulunur:
      </p>
      <ul className="space-y-2 list-disc pl-6">
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
      </ul>
      <p>
        Kullanıcı ülke bilgileri gibi veriler, para birimi ve fiyatlandırma güncellemelerini doğru
        biçimde sunabilmemiz için kullanılabilir. Tüm çerez kullanımı, kullanıcı deneyimini
        kolaylaştırmak ve verimli hizmet sunmak amacı taşır.
      </p>
    </section>

    <section className="space-y-4">
      <h2 className="text-2xl font-semibold">Çerez Tercihlerinizi Yönetme</h2>
      <p>
        Tarayıcınızın ayarlarını düzenleyerek çerez tercihlerinizi yönetebilirsiniz. Tüm çerezleri
        reddedebilir, sabit diskinize kaydedilmeden önce uyarı alabilir, yalnızca belirlediğiniz
        sitelerden gelen çerezleri kabul edebilir ya da daha önce kaydedilen çerezleri
        silebilirsiniz.
      </p>
      <p>
        Üçüncü taraf çerezlerinden vazgeçmek isterseniz ilgili sağlayıcının web sitesini ziyaret
        ederek tercihinizi güncelleyebilirsiniz. Çerezleri reddetmeniz halinde UnivGates’in sunduğu
        bazı özellik ve fonksiyonlardan tam olarak yararlanamayabileceğinizi lütfen unutmayın.
      </p>
    </section>

    <section className="space-y-4">
      <h2 className="text-2xl font-semibold">İletişim</h2>
      <p>
        Çerez politikamız hakkında sorularınız için{" "}
        <a href="mailto:info@univgates.com" className="underline">
          info@univgates.com
        </a>{" "}
        adresinden bizimle iletişime geçebilirsiniz.
      </p>
    </section>
  </>
);

export default CookiePolicy;
