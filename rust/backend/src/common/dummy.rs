use std::error::Error;
use std::fmt::{Display, Formatter, Result as FmtResult};

#[derive(Debug)]
pub struct DummyError;

impl Error for DummyError {}

impl Display for DummyError {
    fn fmt(&self, f: &mut Formatter) -> FmtResult {
        f.write_str("Dummy error")
    }
}
