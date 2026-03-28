export type CharRange = { readonly start: string; readonly end: string };

export type LiteralNode = { readonly type: 'literal'; readonly char: string };
export type CharClassNode = {
  readonly type: 'charClass';
  readonly ranges: ReadonlyArray<CharRange>;
  readonly negated: boolean;
};
export type DotNode = { readonly type: 'dot' };
export type AlternationNode = { readonly type: 'alternation'; readonly alternatives: ReadonlyArray<RegexNode> };
export type SequenceNode = { readonly type: 'sequence'; readonly elements: ReadonlyArray<RegexNode> };
export type GroupNode = {
  readonly type: 'group';
  readonly body: RegexNode;
  readonly capturing: boolean;
  readonly index: number | null;
};
export type QuantifierNode = {
  readonly type: 'quantifier';
  readonly body: RegexNode;
  readonly min: number;
  readonly max: number;
};
export type AnchorNode = { readonly type: 'anchor'; readonly kind: 'start' | 'end' | 'wordBoundary' };
export type BackreferenceNode = { readonly type: 'backreference'; readonly index: number };

export type RegexNode =
  | LiteralNode
  | CharClassNode
  | DotNode
  | AlternationNode
  | SequenceNode
  | GroupNode
  | QuantifierNode
  | AnchorNode
  | BackreferenceNode;
