const nextConfig = {
  outputFileTracingRoot: process.cwd(),
  async redirects() {
    return [
      {
        source: "/private-meetings",
        destination: "/host-at-rorum",
        permanent: true,
      },
      {
        source: "/host-an-event",
        destination: "/host-at-rorum",
        permanent: true,
      },
      {
        source: "/space-decoration-event-styling",
        destination: "/event-decoration",
        permanent: true,
      },
    ];
  },
};

module.exports = nextConfig;
