/*!

### A helper wrapping types

*/

use std::fmt::{Display, Formatter, Result as FmtResult};
use std::iter::IntoIterator;

/**

A wrapper for iterable containers which helps format elements joined using separator, prefixed and/or suffixed.

Usage example:

```
extern crate literium;

use literium::base::wrappers::*;

fn main() {
    let nums = [1, 2, 3];

    let list = DisplayIter::wrap(&nums)
        .separator("; ")
        .to_string();
    assert_eq!(&list, "1; 2; 3");

    let list = DisplayIter::wrap(&nums)
        .separator(" ").item_prefix(":")
        .to_string();
    assert_eq!(&list, ":1 :2 :3");

    let list = DisplayIter::wrap(&nums)
        .separator(" ").item_suffix(",")
        .to_string();
    assert_eq!(&list, "1, 2, 3,");
}
```

*/
#[derive(Debug, Clone)]
pub struct DisplayIter<'a, Container: 'a> {
    container: &'a Container,
    prefix: &'a str,
    item_prefix: &'a str,
    separator: &'a str,
    item_suffix: &'a str,
    suffix: &'a str,
}

impl<'a, C> DisplayIter<'a, C> {
    /// Wrap container to display
    pub fn wrap(container: &'a C) -> Self {
        Self {
            container,
            prefix: "",
            item_prefix: "",
            separator: "",
            item_suffix: "",
            suffix: "",
        }
    }

    /// Set prefix
    pub fn prefix(&mut self, prefix: &'a str) -> &mut Self {
        self.prefix = prefix;
        self
    }

    /// Set item prefix
    pub fn item_prefix(&mut self, prefix: &'a str) -> &mut Self {
        self.item_prefix = prefix;
        self
    }

    /// Set separator
    pub fn separator(&mut self, separator: &'a str) -> &mut Self {
        self.separator = separator;
        self
    }

    /// Set item suffix
    pub fn item_suffix(&mut self, suffix: &'a str) -> &mut Self {
        self.item_suffix = suffix;
        self
    }

    /// Set suffix
    pub fn suffix(&mut self, suffix: &'a str) -> &mut Self {
        self.suffix = suffix;
        self
    }
}

impl<'a, C> Display for DisplayIter<'a, C>
where
    &'a C: IntoIterator,
    <&'a C as IntoIterator>::Item: Display,
{
    fn fmt(&self, f: &mut Formatter) -> FmtResult {
        self.prefix.fmt(f)?;
        let mut iter = self.container.into_iter();
        if let Some(item) = iter.next() {
            self.item_prefix.fmt(f)?;
            item.fmt(f)?;
            self.item_suffix.fmt(f)?;
            for item in iter {
                self.separator.fmt(f)?;
                self.item_prefix.fmt(f)?;
                item.fmt(f)?;
                self.item_suffix.fmt(f)?;
            }
        }
        self.suffix.fmt(f)?;
        Ok(())
    }
}
