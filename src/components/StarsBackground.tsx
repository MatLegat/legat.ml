import type { CSSProperties } from "react";

const STAR_COLOR_ORDERS = [
  ["#ffffff", "#93c5fd", "#a5b4fc", "#f472b6", "#5eead4"],
  ["#5eead4", "#ffffff", "#f472b6", "#93c5fd", "#a5b4fc"],
  ["#a5b4fc", "#5eead4", "#ffffff", "#93c5fd", "#f472b6"],
  ["#f472b6", "#a5b4fc", "#5eead4", "#ffffff", "#93c5fd"],
  ["#93c5fd", "#f472b6", "#ffffff", "#5eead4", "#a5b4fc"],
  ["#5eead4", "#93c5fd", "#a5b4fc", "#ffffff", "#f472b6"],
] as const;

type StarStyle = CSSProperties & {
  "--star-color-1": string;
  "--star-color-2": string;
  "--star-color-3": string;
  "--star-color-4": string;
  "--star-color-5": string;
};

const STARS = [
  {
    left: "6%",
    top: "10%",
    size: "4px",
    duration: "14s",
    delay: "-2s",
    layer: "near",
  },
  {
    left: "12%",
    top: "22%",
    size: "3px",
    duration: "18s",
    delay: "-6s",
    layer: "far",
  },
  {
    left: "18%",
    top: "8%",
    size: "5px",
    duration: "12s",
    delay: "-4s",
    layer: "near",
  },
  {
    left: "24%",
    top: "30%",
    size: "3px",
    duration: "20s",
    delay: "-8s",
    layer: "far",
  },
  {
    left: "31%",
    top: "14%",
    size: "4px",
    duration: "16s",
    delay: "-3s",
    layer: "near",
  },
  {
    left: "38%",
    top: "26%",
    size: "3px",
    duration: "19s",
    delay: "-10s",
    layer: "far",
  },
  {
    left: "44%",
    top: "9%",
    size: "5px",
    duration: "13s",
    delay: "-7s",
    layer: "near",
  },
  {
    left: "49%",
    top: "34%",
    size: "4px",
    duration: "17s",
    delay: "-5s",
    layer: "far",
  },
  {
    left: "56%",
    top: "16%",
    size: "4px",
    duration: "15s",
    delay: "-11s",
    layer: "near",
  },
  {
    left: "62%",
    top: "28%",
    size: "3px",
    duration: "21s",
    delay: "-1s",
    layer: "far",
  },
  {
    left: "69%",
    top: "12%",
    size: "5px",
    duration: "12s",
    delay: "-9s",
    layer: "near",
  },
  {
    left: "75%",
    top: "24%",
    size: "4px",
    duration: "18s",
    delay: "-12s",
    layer: "far",
  },
  {
    left: "82%",
    top: "7%",
    size: "4px",
    duration: "14s",
    delay: "-4s",
    layer: "near",
  },
  {
    left: "88%",
    top: "20%",
    size: "3px",
    duration: "20s",
    delay: "-13s",
    layer: "far",
  },
  {
    left: "94%",
    top: "11%",
    size: "5px",
    duration: "13s",
    delay: "-6s",
    layer: "near",
  },
  {
    left: "9%",
    top: "38%",
    size: "3px",
    duration: "19s",
    delay: "-5s",
    layer: "far",
  },
  {
    left: "21%",
    top: "42%",
    size: "4px",
    duration: "16s",
    delay: "-8s",
    layer: "near",
  },
  {
    left: "34%",
    top: "39%",
    size: "3px",
    duration: "22s",
    delay: "-2s",
    layer: "far",
  },
  {
    left: "47%",
    top: "44%",
    size: "5px",
    duration: "14s",
    delay: "-10s",
    layer: "near",
  },
  {
    left: "59%",
    top: "40%",
    size: "3px",
    duration: "18s",
    delay: "-14s",
    layer: "far",
  },
  {
    left: "71%",
    top: "36%",
    size: "4px",
    duration: "15s",
    delay: "-7s",
    layer: "near",
  },
  {
    left: "83%",
    top: "43%",
    size: "3px",
    duration: "20s",
    delay: "-3s",
    layer: "far",
  },
  {
    left: "91%",
    top: "35%",
    size: "4px",
    duration: "17s",
    delay: "-9s",
    layer: "near",
  },
  {
    left: "5%",
    top: "56%",
    size: "3px",
    duration: "18s",
    delay: "-4s",
    layer: "far",
  },
  {
    left: "14%",
    top: "62%",
    size: "4px",
    duration: "15s",
    delay: "-9s",
    layer: "near",
  },
  {
    left: "22%",
    top: "54%",
    size: "3px",
    duration: "21s",
    delay: "-6s",
    layer: "far",
  },
  {
    left: "29%",
    top: "68%",
    size: "5px",
    duration: "13s",
    delay: "-11s",
    layer: "near",
  },
  {
    left: "37%",
    top: "58%",
    size: "3px",
    duration: "20s",
    delay: "-2s",
    layer: "far",
  },
  {
    left: "45%",
    top: "72%",
    size: "4px",
    duration: "16s",
    delay: "-8s",
    layer: "near",
  },
  {
    left: "53%",
    top: "61%",
    size: "3px",
    duration: "19s",
    delay: "-12s",
    layer: "far",
  },
  {
    left: "61%",
    top: "78%",
    size: "5px",
    duration: "14s",
    delay: "-5s",
    layer: "near",
  },
  {
    left: "69%",
    top: "57%",
    size: "3px",
    duration: "22s",
    delay: "-7s",
    layer: "far",
  },
  {
    left: "76%",
    top: "70%",
    size: "4px",
    duration: "17s",
    delay: "-10s",
    layer: "near",
  },
  {
    left: "84%",
    top: "60%",
    size: "3px",
    duration: "20s",
    delay: "-3s",
    layer: "far",
  },
  {
    left: "92%",
    top: "75%",
    size: "4px",
    duration: "15s",
    delay: "-13s",
    layer: "near",
  },
  {
    left: "10%",
    top: "86%",
    size: "3px",
    duration: "21s",
    delay: "-1s",
    layer: "far",
  },
  {
    left: "26%",
    top: "90%",
    size: "4px",
    duration: "16s",
    delay: "-6s",
    layer: "near",
  },
  {
    left: "41%",
    top: "84%",
    size: "3px",
    duration: "18s",
    delay: "-9s",
    layer: "far",
  },
  {
    left: "58%",
    top: "92%",
    size: "5px",
    duration: "14s",
    delay: "-4s",
    layer: "near",
  },
  {
    left: "73%",
    top: "87%",
    size: "3px",
    duration: "19s",
    delay: "-12s",
    layer: "far",
  },
  {
    left: "89%",
    top: "91%",
    size: "4px",
    duration: "15s",
    delay: "-7s",
    layer: "near",
  },
];

export default function StarsBackground() {
  return (
    <div className="stars-bg" aria-hidden="true">
      {STARS.map((star, index) =>
        (() => {
          const colorDuration = `${9 + (index % 5) * 2}s`;
          const colorDelay = `-${(index * 3) % 11}s`;
          const colorOrder = STAR_COLOR_ORDERS[index % STAR_COLOR_ORDERS.length];

          return (
            <span
              key={`${star.left}-${star.top}-${index}`}
              className={`stars-bg__star stars-bg__star--${star.layer}`}
              style={
                {
                  left: star.left,
                  top: star.top,
                  width: star.size,
                  height: star.size,
                  animationDuration: `${star.duration}, ${colorDuration}`,
                  animationDelay: `${star.delay}, ${colorDelay}`,
                  "--star-color-1": colorOrder[0],
                  "--star-color-2": colorOrder[1],
                  "--star-color-3": colorOrder[2],
                  "--star-color-4": colorOrder[3],
                  "--star-color-5": colorOrder[4],
                } as StarStyle
              }
            />
          );
        })(),
      )}
    </div>
  );
}
