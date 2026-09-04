"use client";

/* Traced from the Paper file so the panel's iconography matches the design
   rather than approximating it. 16px for actions, 18px for tabs. */

const s16 = {
  width: 16,
  height: 16,
  viewBox: "0 0 16 16",
  fill: "none",
  xmlns: "http://www.w3.org/2000/svg",
};
const s18 = {
  width: 18,
  height: 18,
  viewBox: "0 0 18 18",
  fill: "none",
  xmlns: "http://www.w3.org/2000/svg",
};
const stroke = {
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

/* ---------------------------------------------------------- panel actions */

export const IconSun = () => (
  <svg {...s16}>
    <path
      {...stroke}
      d="M8 2V1.333M8 14.666V14M12.239 3.76l.473-.474M3.285 12.713l.474-.473M14 8h.665M1.332 8h.667M12.239 12.24l.473.473M3.285 3.286l.474.474M10.356 5.643a3.333 3.333 0 1 1-4.714 4.714 3.333 3.333 0 0 1 4.714-4.714Z"
    />
  </svg>
);

export const IconMoon = () => (
  <svg {...s16}>
    <path
      {...stroke}
      d="M13.98 8.512C13.228 9.03 12.317 9.333 11.335 9.333C8.757 9.333 6.668 7.244 6.668 4.667C6.668 3.684 6.971 2.773 7.489 2.021C4.417 2.282 2.004 4.858 2.004 7.999C2.004 11.312 4.69 13.997 8.003 13.997C11.143 13.997 13.72 11.585 13.98 8.512Z"
    />
  </svg>
);

export const IconReset = () => (
  <svg {...s16}>
    <path {...stroke} d="M3.332 5.333A5.333 5.333 0 0 1 13.332 8" />
    <path {...stroke} strokeWidth={1.333} d="M3.332 2.666v2.667h2.667" />
    <path {...stroke} strokeWidth={1.333} d="M12.675 13.333v-2.667h-2.667" />
    <path
      {...stroke}
      strokeWidth={1.333}
      d="M2.668 8a5.333 5.333 0 0 0 10 2.667"
    />
  </svg>
);

export const IconShuffle = () => (
  <svg {...s16}>
    <path
      {...stroke}
      d="M2 12h1.057c.177 0 .347-.07.472-.196l6.942-6.943c.125-.125.295-.195.472-.195h1.724"
    />
    <path {...stroke} strokeWidth={1.333} d="M2 4h1.057c.177 0 .347.07.472.195L5.333 6" />
    <path
      {...stroke}
      strokeWidth={1.333}
      d="M12.665 11.333h-1.724c-.176 0-.346-.07-.471-.195L9.332 10"
    />
    <path {...stroke} strokeWidth={1.333} d="m12 2.666 2 2-2 2" />
    <path {...stroke} strokeWidth={1.333} d="m12 9.334 2 2-2 2" />
  </svg>
);

export const IconDownload = () => (
  <svg {...s16}>
    <path {...stroke} d="M13.333 10v2a1.333 1.333 0 0 1-1.333 1.333H4A1.333 1.333 0 0 1 2.667 12v-2" />
    <path {...stroke} d="M5.667 7.333 8 9.667l2.333-2.334" />
    <path {...stroke} d="M8 9.333V2.667" />
  </svg>
);

export const IconX = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" className="brand-glyph">
    <path
      fill="currentColor"
      d="M12.595.773h2.441L9.703 6.91 16 15.231h-4.948L7.197 10.187 2.763 15.231H.321L6.04 8.677 0 .773h5.076l3.502 4.627L12.595.773Zm-.868 12.98h1.349L4.337 2.155H2.859l8.868 11.598Z"
    />
  </svg>
);

export const IconGithub = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" className="brand-glyph">
    <path
      fill="currentColor"
      d="M6.765 11.491C4.703 11.241 3.25 9.757 3.25 7.835c0-.781.281-1.625.75-2.187-.203-.516-.172-1.609.063-2.063.624-.078 1.468.25 1.968.704.594-.188 1.219-.282 1.984-.282s1.391.094 1.954.266c.484-.438 1.344-.766 1.968-.688.219.422.25 1.516.048 2.047.5.594.765 1.391.765 2.203 0 1.922-1.453 3.375-3.547 3.641.532.344.891 1.094.891 1.953v1.625c0 .469.391.735.859.547 2.828-1.078 5.047-3.906 5.047-7.406 0-4.422-3.594-8.032-8.015-8.032C3.563.163 0 3.773 0 8.195c0 3.468 2.203 6.344 5.172 7.422.422.156.828-.126.828-.547v-1.25c-.219.093-.5.156-.75.156-1.031 0-1.641-.563-2.078-1.609-.172-.422-.359-.672-.719-.719-.188-.016-.25-.094-.25-.188 0-.187.312-.328.625-.328.453 0 .844.281 1.25.859.313.454.641.657 1.031.657.391 0 .641-.141 1-.5.266-.266.469-.5.656-.657Z"
    />
  </svg>
);

/* ------------------------------------------------------------------ tabs */

export const IconShape = () => (
  <svg {...s18}>
    <path
      {...stroke}
      strokeLinecap="butt"
      d="M5.69 3.44A1.5 1.5 0 0 0 4.63 3H4.5A1.5 1.5 0 0 0 3 4.5v.129c0 .398.158.78.44 1.061a1.5 1.5 0 0 1 0 2.121A1.5 1.5 0 0 0 3 8.871v.258c0 .398.158.78.44 1.061a1.5 1.5 0 0 1 0 2.121A1.5 1.5 0 0 0 3 13.371v.129A1.5 1.5 0 0 0 4.5 15h.129c.398 0 .78-.158 1.061-.439a1.5 1.5 0 0 1 2.121 0c.282.281.664.439 1.061.439h.258c.398 0 .78-.158 1.061-.439a1.5 1.5 0 0 1 2.121 0c.282.281.664.439 1.061.439h.129a1.5 1.5 0 0 0 1.5-1.5v-.129c0-.397-.158-.779-.439-1.06a1.5 1.5 0 0 1 0-2.122c.281-.281.439-.663.439-1.06v-.259c0-.397-.158-.779-.439-1.06a1.5 1.5 0 0 1 0-2.122c.281-.281.439-.663.439-1.06V4.5A1.5 1.5 0 0 0 13.5 3h-.129c-.397 0-.779.158-1.06.44a1.5 1.5 0 0 1-2.122 0A1.5 1.5 0 0 0 9.13 3h-.259c-.397 0-.779.158-1.06.44a1.5 1.5 0 0 1-2.122 0Z"
    />
    <path
      {...stroke}
      strokeLinecap="butt"
      d="M9 6.375A2.625 2.625 0 0 0 6.632 10.134c1.388-.096 2.52.585 3.812 1.059A2.625 2.625 0 0 0 9 6.375Z"
    />
    <path {...stroke} strokeLinecap="butt" d="M10.445 11.193c1.049.385 2.204.633 3.685.216" />
    <path {...stroke} strokeLinecap="butt" d="M3.879 11.279c1.058-.771 1.949-1.089 2.753-1.144" />
  </svg>
);

export const IconMaterial = () => (
  <svg {...s18}>
    <path
      {...stroke}
      strokeLinecap="butt"
      d="M14.25 3H3.75a.75.75 0 0 0-.75.75v10.5c0 .414.336.75.75.75h10.5a.75.75 0 0 0 .75-.75V3.75a.75.75 0 0 0-.75-.75Z"
    />
    <path {...stroke} strokeLinejoin="miter" d="M8.998 3c-.677 5.632 4.885 2.644 6 7.5" />
    <path
      {...stroke}
      strokeLinejoin="miter"
      d="M3 10.086c3.75-2.961 3.63-.336 5.625 1.164 1.527 1.148 3.75.75 4.125 3.75"
    />
    <path
      {...stroke}
      strokeLinejoin="miter"
      d="M3 12.459c.538-.282 1.226-.559 2.019-.423 1.321.225 1.616 2.117 3.231 2.964"
    />
  </svg>
);

export const IconFrame = () => (
  <svg {...s18}>
    <path
      {...stroke}
      strokeLinecap="butt"
      d="M2.25 4.5A.75.75 0 0 1 3 3.75h12a.75.75 0 0 1 .75.75v9a.75.75 0 0 1-.75.75H3a.75.75 0 0 1-.75-.75v-9Z"
    />
  </svg>
);

export const IconContent = () => (
  <svg {...s18}>
    <path {...stroke} d="M5.195 15V8.249" />
    <path {...stroke} d="M16.5 3.75h-9" />
    <path {...stroke} d="M9 8.25H1.5" />
    <path {...stroke} d="M12 3.75V15" />
  </svg>
);

export const IconInk = () => (
  <svg {...s18}>
    <path
      {...stroke}
      strokeLinecap="butt"
      d="M14.25 10.5A5.25 5.25 0 0 1 3.75 10.5c0-3.369 3.502-6.888 4.786-8.064a.687.687 0 0 1 .928 0c1.284 1.176 4.786 4.695 4.786 8.064Z"
    />
  </svg>
);

export const IconView = () => (
  <svg {...s18}>
    <path
      {...stroke}
      d="M12 13.5h3a.75.75 0 0 0 .75-.75V4.5a.75.75 0 0 0-.75-.75H9m3 9.75.75 2.25M12 13.5H6m0 0H3a.75.75 0 0 1-.75-.75V4.5A.75.75 0 0 1 3 3.75h6M6 13.5l-.75 2.25M9 3.75V2.25"
    />
    <path {...stroke} d="M9 13.5V15" />
  </svg>
);

/* ------------------------------------------------------------- alignment */

export const IconAlignLeft = () => (
  <svg {...s16}>
    <path {...stroke} d="M2 3.5h12M2 8h7M2 12.5h10" />
  </svg>
);
export const IconAlignCenter = () => (
  <svg {...s16}>
    <path {...stroke} d="M2 3.5h12M4.5 8h7M3 12.5h10" />
  </svg>
);
export const IconAlignRight = () => (
  <svg {...s16}>
    <path {...stroke} d="M2 3.5h12M7 8h7M4 12.5h10" />
  </svg>
);

export const IconCheck = () => (
  <svg {...s16}>
    <path {...stroke} d="m3.5 8.5 3 3 6-7" />
  </svg>
);

export const IconUpload = () => (
  <svg {...s16} style={{ marginBottom: 2 }}>
    <path {...stroke} d="M13.333 10v2a1.333 1.333 0 0 1-1.333 1.333H4A1.333 1.333 0 0 1 2.667 12v-2" />
    <path {...stroke} d="M10.333 5 8 2.667 5.667 5" />
    <path {...stroke} d="M8 2.667v6.666" />
  </svg>
);

/* the stacked up/down caret the Paper select trigger uses */
export const IconChevrons = () => (
  <svg {...s16} width={14} height={14} viewBox="0 0 16 16">
    <path {...stroke} strokeWidth={1.4} d="m5 6.5 3-3 3 3" />
    <path {...stroke} strokeWidth={1.4} d="m5 9.5 3 3 3-3" />
  </svg>
);

export const IconTick = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M3.333 9.083 5.8 11.5l6.533-7.333"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const IconTrash = () => (
  <svg {...s16} width={14} height={14}>
    <path {...stroke} strokeWidth={1.4} d="M2.667 4.667h10.666" />
    <path {...stroke} strokeWidth={1.4} d="M6.667 7.333v3.334M9.333 7.333v3.334" />
    <path
      {...stroke}
      strokeWidth={1.4}
      d="M3.333 4.667 4 12.667a1.333 1.333 0 0 0 1.333 1.333h5.334A1.333 1.333 0 0 0 12 12.667l.667-8"
    />
    <path {...stroke} strokeWidth={1.4} d="M6 4.667V3.333A.667.667 0 0 1 6.667 2.667h2.666a.667.667 0 0 1 .667.666v1.334" />
  </svg>
);
