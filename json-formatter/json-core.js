(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.JuankitJson = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const NUMBER_PATTERN = /^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/;
  const MAX_DEPTH = 2048;

  function locationAt(text, offset) {
    let line = 1;
    let column = 1;
    for (let index = 0; index < offset && index < text.length; index += 1) {
      if (text[index] === '\r') {
        if (text[index + 1] === '\n') index += 1;
        line += 1;
        column = 1;
      } else if (text[index] === '\n') {
        line += 1;
        column = 1;
      } else {
        column += 1;
      }
    }
    return { line, column };
  }

  function jsonError(text, offset, message) {
    const location = locationAt(text, offset);
    const error = new SyntaxError(`${message} (line ${location.line}, column ${location.column})`);
    error.offset = offset;
    error.line = location.line;
    error.column = location.column;
    return error;
  }

  function tokenize(text) {
    const tokens = [];
    let index = 0;
    let line = 1;
    let column = 1;

    function push(type, start, startLine, startColumn) {
      tokens.push({
        type,
        raw: text.slice(start, index),
        start,
        end: index,
        line: startLine,
        column: startColumn,
      });
    }

    function skipWhitespace() {
      while (index < text.length) {
        const char = text[index];
        if (char === ' ' || char === '\t') {
          index += 1;
          column += 1;
        } else if (char === '\r') {
          index += 1;
          if (text[index] === '\n') index += 1;
          line += 1;
          column = 1;
        } else if (char === '\n') {
          index += 1;
          line += 1;
          column = 1;
        } else {
          break;
        }
      }
    }

    while (index < text.length) {
      skipWhitespace();
      if (index >= text.length) break;

      const start = index;
      const startLine = line;
      const startColumn = column;
      const char = text[index];

      if ('{}[],:'.includes(char)) {
        index += 1;
        column += 1;
        push('punctuation', start, startLine, startColumn);
        continue;
      }

      if (char === '"') {
        index += 1;
        column += 1;
        let closed = false;

        while (index < text.length) {
          const current = text[index];
          const code = text.charCodeAt(index);
          if (current === '"') {
            index += 1;
            column += 1;
            closed = true;
            break;
          }
          if (code <= 0x1f) {
            throw jsonError(text, index, 'Unescaped control character in string');
          }
          if (current === '\\') {
            const escaped = text[index + 1];
            if (!escaped) throw jsonError(text, index, 'Unterminated escape sequence');
            if (escaped === 'u') {
              const hex = text.slice(index + 2, index + 6);
              if (!/^[0-9a-fA-F]{4}$/.test(hex)) {
                throw jsonError(text, index, 'Invalid Unicode escape sequence');
              }
              index += 6;
              column += 6;
            } else if ('"\\/bfnrt'.includes(escaped)) {
              index += 2;
              column += 2;
            } else {
              throw jsonError(text, index, `Invalid escape sequence \\${escaped}`);
            }
          } else {
            index += 1;
            column += 1;
          }
        }

        if (!closed) throw jsonError(text, start, 'Unterminated string');
        push('string', start, startLine, startColumn);
        continue;
      }

      if (char === '-' || (char >= '0' && char <= '9')) {
        const match = NUMBER_PATTERN.exec(text.slice(index));
        if (!match) throw jsonError(text, index, 'Invalid number');
        index += match[0].length;
        column += match[0].length;
        push('number', start, startLine, startColumn);
        continue;
      }

      let literal = '';
      if (text.startsWith('true', index)) literal = 'true';
      else if (text.startsWith('false', index)) literal = 'false';
      else if (text.startsWith('null', index)) literal = 'null';
      if (literal) {
        index += literal.length;
        column += literal.length;
        push(literal === 'null' ? 'null' : 'boolean', start, startLine, startColumn);
        continue;
      }

      throw jsonError(text, index, `Unexpected character ${JSON.stringify(char)}`);
    }

    return tokens;
  }

  function validateTokens(tokens, text) {
    let index = 0;

    function current() {
      return tokens[index];
    }

    function fail(message, token) {
      throw jsonError(text, token ? token.start : text.length, message);
    }

    function take(raw, message) {
      const token = current();
      if (!token || token.raw !== raw) fail(message || `Expected ${raw}`, token);
      index += 1;
      return token;
    }

    function parseValue(depth) {
      if (depth > MAX_DEPTH) fail(`JSON nesting exceeds ${MAX_DEPTH} levels`, current());
      const token = current();
      if (!token) fail('Expected a JSON value');

      if (token.raw === '{') {
        parseObject(depth + 1);
        return;
      }
      if (token.raw === '[') {
        parseArray(depth + 1);
        return;
      }
      if (token.type === 'string' || token.type === 'number' || token.type === 'boolean' || token.type === 'null') {
        index += 1;
        return;
      }
      fail('Expected a JSON value', token);
    }

    function parseObject(depth) {
      take('{');
      if (current() && current().raw === '}') {
        index += 1;
        return;
      }

      while (true) {
        const key = current();
        if (!key || key.type !== 'string') fail('Expected a quoted property name', key);
        key.role = 'key';
        index += 1;
        take(':', 'Expected a colon after the property name');
        parseValue(depth);

        const separator = current();
        if (separator && separator.raw === ',') {
          index += 1;
          if (current() && current().raw === '}') fail('Trailing commas are not valid JSON', current());
          continue;
        }
        take('}', 'Expected a comma or closing brace');
        return;
      }
    }

    function parseArray(depth) {
      take('[');
      if (current() && current().raw === ']') {
        index += 1;
        return;
      }

      while (true) {
        parseValue(depth);
        const separator = current();
        if (separator && separator.raw === ',') {
          index += 1;
          if (current() && current().raw === ']') fail('Trailing commas are not valid JSON', current());
          continue;
        }
        take(']', 'Expected a comma or closing bracket');
        return;
      }
    }

    parseValue(0);
    if (index < tokens.length) fail('Unexpected content after the root JSON value', current());
    return tokens;
  }

  function parse(text) {
    const source = String(text);
    return validateTokens(tokenize(source), source);
  }

  function indentUnit(indent) {
    if (indent === '\t' || indent === 'tab') return '\t';
    const size = Math.max(0, Math.min(10, Number(indent) || 0));
    return ' '.repeat(size);
  }

  function format(text, indent) {
    const tokens = parse(text);
    const unit = indentUnit(indent);
    let depth = 0;
    let output = '';

    tokens.forEach((token, tokenIndex) => {
      const raw = token.raw;
      const previous = tokens[tokenIndex - 1];
      const next = tokens[tokenIndex + 1];

      if (raw === '{' || raw === '[') {
        output += raw;
        if (!next || !((raw === '{' && next.raw === '}') || (raw === '[' && next.raw === ']'))) {
          depth += 1;
          output += `\n${unit.repeat(depth)}`;
        }
      } else if (raw === '}' || raw === ']') {
        const isEmpty = previous && ((previous.raw === '{' && raw === '}') || (previous.raw === '[' && raw === ']'));
        if (!isEmpty) {
          depth = Math.max(0, depth - 1);
          output += `\n${unit.repeat(depth)}`;
        }
        output += raw;
      } else if (raw === ',') {
        output += `,\n${unit.repeat(depth)}`;
      } else if (raw === ':') {
        output += ': ';
      } else {
        output += raw;
      }
    });

    return output;
  }

  function minify(text) {
    return parse(text).map((token) => token.raw).join('');
  }

  return { format, locationAt, minify, parse, tokenize };
});
