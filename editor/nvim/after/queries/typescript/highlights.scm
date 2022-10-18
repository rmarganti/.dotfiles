; extends

; Overwrites nvim-treesitter's special treatment of type imports.
(import_statement "type"
  (import_clause
    (named_imports
      ((import_specifier
          name: (identifier) @variable)))))
