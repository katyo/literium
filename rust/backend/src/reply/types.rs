use std::error::Error;
use std::fmt::{Debug, Display, Formatter, Result as FmtResult};

/** Server stream error wrapper

This type helps avoid boxing of error values.
 */
#[derive(Debug)]
pub enum ReplyStreamError<SE, CE> {
    StreamError(SE),
    CodingError(CE),
}

impl<SE, CE> Error for ReplyStreamError<SE, CE>
where
    SE: Debug + Display,
    CE: Debug + Display,
{}

impl<SE, CE> Display for ReplyStreamError<SE, CE>
where
    SE: Display,
    CE: Display,
{
    fn fmt(&self, f: &mut Formatter) -> FmtResult {
        use self::ReplyStreamError::*;
        match self {
            StreamError(error) => error.fmt(f),
            CodingError(error) => error.fmt(f),
        }
    }
}
