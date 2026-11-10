// The leading "-" keeps TanStack Router from treating this file as a route.
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Route } from "./index";

describe("index page SSR", () => {
  it("includes the full CV in the server HTML", () => {
    const Index = Route.options.component!;
    const html = renderToString(<Index />);

    for (const text of [
      "Matteus Legat",
      "Binamik Tecnologia",
      "Valtech Brazil",
      "Federal University of Santa Catarina",
      "Vitest, Jest, Jasmine",
      "open to opportunities",
      "github.com/matlegat",
      "linkedin.com/in/matlegat",
      "Matteus_Legat_CV.pdf",
    ]) {
      expect(html).toContain(text);
    }
  });
});
