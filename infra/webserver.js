function getOrigin() {
  if (["development", "test"].includes(process.env.NODE_ENV)) {
    return `http://localhost:${process.env.PORT || 3000}`;
  }

  if (process.env.VERCEL_ENV === "preview") {
    return `https://${process.env.VERCEL_URL}`;
  }

  return "https://arthurbarbosadev.com";
}

const webserver = {
  origin: getOrigin(),
};

export default webserver;
