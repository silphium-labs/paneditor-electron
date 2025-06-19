import { useContext, createSignal, Show } from 'solid-js';
import { SelectionContext, EditContext, nodeBindings } from '../../state/solid.js';

import {
  printAttributes,
  printNodeFlags,
  printReferenceTag,
  printType,
} from '@bablr/agast-helpers/print';
import { isGapNode, isNullNode } from '@bablr/agast-helpers/path';

import { getCooked, printString } from '@bablr/agast-helpers/tree';
import classNames from 'classnames';

function SnippetsContext() {
  return '...snippets';
}

export default SnippetsContext;
