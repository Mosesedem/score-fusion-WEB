export function generateBZScoreHTML(atts: Record<string, string> = {}) {
  // Default attributes
  const defaultAtts = {
    "font-size": "11px",
    "font-family": "",
    data: "today",
    "data-2": "",
    "country-is": "",
    "league-is": "",
    sport: "football(soccer)",
  };

  const finalAtts = { ...defaultAtts, ...atts };

  // Default options (colors, etc.)
  const opts: Record<string, string> = {
    bz_lang: "en",
    bz_c_link: "off", // Default to off, uses iframe
    bz_your_word: "livescore",
    // Add default colors if needed
  };

  let bz_your_code = `
    var fm_inf_1 = "${finalAtts["font-family"]}";
    var fs_inf_1 = "${finalAtts["font-size"]}";
  `;

  // Language
  const bz_lang_is_ok = [
    "en",
    "de",
    "pt",
    "nl",
    "tr",
    "si",
    "rs",
    "it",
    "fr",
    "ro",
  ];
  let bz_lang_is_x = opts.bz_lang || "en";
  if (!bz_lang_is_ok.includes(bz_lang_is_x)) {
    bz_lang_is_x = "en";
  }

  let bz_your_word_is = opts.bz_your_word || "livescore";
  if (bz_your_word_is === "") {
    bz_your_word_is = "livescore";
  }

  let bz_domain = "https://www.livescore.bz";
  if (bz_lang_is_x !== "en") {
    bz_domain += `/${bz_lang_is_x}`;
  }
  if (bz_lang_is_x === "tr") {
    bz_domain = "https://www.macsonuclari.mobi";
  }

  if (finalAtts["data-2"] === "league") {
    bz_your_word_is = `${finalAtts["country-is"]} ~ ${finalAtts["league-is"]} livescore`;
  }
  if (
    finalAtts["country-is"] === "england" &&
    finalAtts["league-is"] === "premier league"
  ) {
    bz_your_word_is = "epl livescore";
  }

  // Check if credit link is on
  const bz_c_link_is = opts.bz_c_link;
  if (bz_c_link_is === "on") {
    // Use script and anchor
    bz_your_code += `
      <script
        type="text/javascript"
        src="https://www.livescore.bz/api.livescore.0.1.js?v1.3"
        api="livescore"
        async
      ></script>
      <a
        href="${bz_domain}"
        sport="${finalAtts.sport}"
        data-1="${finalAtts.data}"
        data-2="${finalAtts["data-2"]}"
        lang="${bz_lang_is_x}"
      >
        ${bz_your_word_is}
      </a>
    `;
  } else {
    // Use iframe
    bz_your_code = `
      <iframe
        src="https://www.livescore.bz/webmasters.asp?lang=${bz_lang_is_x}&sport=${encodeURIComponent(
      finalAtts.sport
    )}&data-1=${finalAtts.data}&data-2=${
      finalAtts["data-2"]
    }&word=${encodeURIComponent(bz_your_word_is)}"
        marginheight="0"
        marginwidth="0"
        scrolling="auto"
        height="600"
        width="100"
        frameborder="0"
        id="bzscoreframe"
        style="width:100%; height:600px"
      ></iframe>
    `;
  }

  return bz_your_code;
}
