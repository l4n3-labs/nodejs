import { Head } from 'nextra/components';
import { getPageMap } from 'nextra/page-map';
import { Footer, Layout, Navbar } from 'nextra-theme-docs';
import 'nextra-theme-docs/style.css';

export const metadata = {
  title: {
    default: 'fakeish',
    template: '%s – fakeish',
  },
  description: 'Generate realistic test fixtures from Zod schemas',
};

const navbar = <Navbar logo={<b>fakeish</b>} projectLink="https://github.com/l4n3/nodejs" />;

const footer = <Footer>MIT {new Date().getFullYear()} © l4n3.</Footer>;

const RootLayout = async ({ children }: { children: React.ReactNode }) => {
  const pageMap = await getPageMap();
  return (
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <Head />
      <body suppressHydrationWarning>
        <Layout
          navbar={navbar}
          pageMap={pageMap}
          docsRepositoryBase="https://github.com/l4n3/nodejs/tree/main/docs/site"
          footer={footer}
        >
          {children}
        </Layout>
      </body>
    </html>
  );
};

export default RootLayout;
