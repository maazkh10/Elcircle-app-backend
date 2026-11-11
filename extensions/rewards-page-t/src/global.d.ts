declare namespace JSX {
  interface IntrinsicElements {
    "s-box": {
      children?: any;
      padding?: string;
      margin?: string;
      marginBlockStart?: string;
      marginBlockEnd?: string;
      gap?: string;
      direction?: string;
      border?: string;
      cornerRadius?: string;
      background?: string;
      width?: string;
    };

    "s-text": {
      children?: any;
      emphasis?: string;
      appearance?: string;
      size?: string;
    };

    "s-divider": {};
  }
}
