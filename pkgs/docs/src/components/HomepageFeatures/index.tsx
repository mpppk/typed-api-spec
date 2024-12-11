import clsx from "clsx";
import Heading from "@theme/Heading";
import styles from "./styles.module.css";
import mountainSvg from "../../../static/img/undraw_docusaurus_mountain.svg";
import treeSvg from "../../../static/img/undraw_docusaurus_tree.svg";
import reactSvg from "../../../static/img/undraw_docusaurus_react.svg";

type FeatureItem = {
  title: string;
  Svg: React.ComponentType<React.ComponentProps<"svg">>;
  description: JSX.Element;
};

const FeatureList: FeatureItem[] = [
  {
    title: "All you need is TypeScript",
    Svg: mountainSvg,
    description: (
      <>
        typed-api-spec's API definition schema is built on top of TypeScript, so
        you can use the full power of the type system
      </>
    ),
  },
  {
    title: "type-safe, zero-runtime client",
    Svg: treeSvg,
    description: (
      <>
        typed-api-spec provides type-safe, 0kb bundle size API client. You can
        use it with zero-runtime, zero-overhead, zero-dependency and
        zero-learning-cost (because it is just <i>fetch</i>!).
      </>
    ),
  },
  {
    title: "Framework-agnostic",
    Svg: reactSvg,
    description: (
      <>
        typed-api-spec does not require any other dependencies. It supports
        server frameworks(e.g. Express, Fastify) and validation libraries)(e.g.
        zod, valibot), but these are optional and you can use only those you
        need.
      </>
    ),
  },
];

function Feature({ title, Svg, description }: FeatureItem) {
  return (
    <div className={clsx("col col--4")}>
      <div className="text--center">
        <Svg className={styles.featureSvg} role="img" />
      </div>
      <div className="text--center padding-horiz--md">
        <Heading as="h3">{title}</Heading>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures(): JSX.Element {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
