"use client";

/**
 * A duplex cancellation: dated circle plus killer bars. Struck by hand, so the
 * ink is uneven and the whole thing sits at an angle to the stamp.
 */
export function Postmark({
  cx,
  cy,
  r,
  town,
  date,
  color,
  opacity,
  rotation,
  family,
  uid,
}: {
  cx: number;
  cy: number;
  r: number;
  town: string;
  date: string;
  color: string;
  opacity: number;
  rotation: number;
  family: string;
  uid: string;
}) {
  const arcTop = `${uid}-pm-top`;
  const arcBottom = `${uid}-pm-bottom`;
  const inner = r * 0.78;
  const bars = [0, 1, 2, 3, 4];

  return (
    <g
      transform={`rotate(${rotation} ${cx} ${cy})`}
      opacity={opacity}
      style={{ mixBlendMode: "multiply" }}
    >
      <defs>
        <path
          id={arcTop}
          d={`M ${cx - inner * 0.86} ${cy} A ${inner * 0.86} ${inner * 0.86} 0 0 1 ${cx + inner * 0.86} ${cy}`}
          fill="none"
        />
        <path
          id={arcBottom}
          d={`M ${cx + inner * 0.82} ${cy + r * 0.05} A ${inner * 0.82} ${inner * 0.82} 0 0 1 ${cx - inner * 0.82} ${cy + r * 0.05}`}
          fill="none"
        />
        <filter
          id={`${uid}-pm-ink`}
          x="-20%"
          y="-20%"
          width="140%"
          height="140%"
        >
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.26"
            numOctaves={2}
            seed={19}
            result="n"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="n"
            scale={0.7}
            xChannelSelector="R"
            yChannelSelector="G"
            result="struck"
          />
          {/* a light speckle so the strike breaks up, not so heavy it erases it */}
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.32"
            numOctaves={2}
            seed={31}
            result="speck"
          />
          <feColorMatrix
            in="speck"
            type="matrix"
            values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -0.3 1.06"
            result="mask"
          />
          <feComposite in="struck" in2="mask" operator="in" />
        </filter>
      </defs>

      <g filter={`url(#${uid}-pm-ink)`} fill={color} stroke={color}>
        <circle cx={cx} cy={cy} r={r} fill="none" strokeWidth={r * 0.055} />
        <circle cx={cx} cy={cy} r={inner} fill="none" strokeWidth={r * 0.03} />

        <text
          fontFamily={family}
          fontSize={r * 0.215}
          fontWeight={700}
          letterSpacing={r * 0.02}
          stroke="none"
          textAnchor="middle"
        >
          <textPath href={`#${arcTop}`} startOffset="50%">
            {town.toUpperCase()}
          </textPath>
        </text>
        <text
          fontFamily={family}
          fontSize={r * 0.17}
          fontWeight={700}
          letterSpacing={r * 0.03}
          stroke="none"
          textAnchor="middle"
        >
          <textPath href={`#${arcBottom}`} startOffset="50%">
            {"★ PAID ★"}
          </textPath>
        </text>

        <line
          x1={cx - inner * 0.72}
          y1={cy - r * 0.16}
          x2={cx + inner * 0.72}
          y2={cy - r * 0.16}
          strokeWidth={r * 0.02}
        />
        <line
          x1={cx - inner * 0.72}
          y1={cy + r * 0.26}
          x2={cx + inner * 0.72}
          y2={cy + r * 0.26}
          strokeWidth={r * 0.02}
        />
        <text
          x={cx}
          y={cy + r * 0.14}
          fontFamily={family}
          fontSize={r * 0.28}
          fontWeight={700}
          letterSpacing={r * 0.02}
          textAnchor="middle"
          stroke="none"
        >
          {date}
        </text>

        {/* killer bars, drawn as a wave the way a duplex handstamp cuts */}
        {bars.map((i) => {
          const y = cy - r * 0.62 + i * r * 0.31;
          const x0 = cx + r * 1.02;
          const x1 = cx + r * 2.05;
          const a = r * 0.055;
          return (
            <path
              key={i}
              d={`M ${x0} ${y} C ${x0 + (x1 - x0) * 0.3} ${y - a} ${x0 + (x1 - x0) * 0.62} ${y + a} ${x1} ${y - a * 0.3}`}
              fill="none"
              strokeWidth={r * 0.07}
              strokeLinecap="round"
            />
          );
        })}
      </g>
    </g>
  );
}
