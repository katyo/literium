use serde::de::DeserializeOwned;
use serde::Serialize;
use std::error::Error;
use std::fmt::{Display, Formatter, Result as FmtResult};
use std::fs::{metadata, File};
use std::io::{self, Read, Write};
use std::ops::{Deref, DerefMut};
use std::path::{Path, PathBuf};
use toml::{de, from_str, ser, to_string_pretty};

/**

## Persistent configuration in TOML file

This type wraps serializable config and provides load/save features.

```
extern crate serde;
#[macro_use]
extern crate serde_derive;
extern crate literium;

use literium::FileConfig;
use std::path::PathBuf;
use std::fs::remove_file;

#[derive(Serialize, Deserialize, Default)]
struct MyConfig {
    #[serde(default)]
    site: SiteConfig,
}

#[derive(Serialize, Deserialize)]
struct SiteConfig {
    database: String,
    filepath: PathBuf,
}

impl Default for SiteConfig {
    fn default() -> Self {
        Self {
            database: "127.0.0.1:3030".into(),
            filepath: "./files".into(),
        }
    }
}

fn main() {
    let mut cfg = FileConfig::<MyConfig>::load("Server.toml")
        .unwrap();

    assert_eq!(&cfg.site.database, "127.0.0.1:3030");
    assert_eq!(&cfg.site.filepath, &PathBuf::from("./files"));

    cfg.site.database = "127.0.1.1:3344".into();
    cfg.site.filepath = "./temp-files".into();

    cfg.save().unwrap();

    let cfg2 = FileConfig::<MyConfig>::load("Server.toml")
        .unwrap();

    assert_eq!(&cfg.site.database, "127.0.1.1:3344");
    assert_eq!(&cfg.site.filepath, &PathBuf::from("./temp-files"));

    remove_file("Server.toml").unwrap();
}

```

*/
pub struct FileConfig<T> {
    path: PathBuf,
    data: T,
}

impl<T> Deref for FileConfig<T> {
    type Target = T;

    fn deref(&self) -> &T {
        &self.data
    }
}

impl<T> DerefMut for FileConfig<T> {
    fn deref_mut(&mut self) -> &mut T {
        &mut self.data
    }
}

impl<T> FileConfig<T> {
    /// Create default config
    pub fn init<P, E>(path: P) -> Self
    where
        P: AsRef<Path>,
        T: Default,
    {
        let path = path.as_ref().to_owned();
        let data = T::default();
        Self { path, data }
    }

    /// Load config from file `path`
    pub fn load<P>(path: P) -> Result<Self, PersistError>
    where
        P: AsRef<Path>,
        T: DeserializeOwned + Default,
    {
        let path = path.as_ref().to_owned();
        if let Err(error) = metadata(&path) {
            if error.kind() == io::ErrorKind::NotFound {
                return Ok(Self {
                    path,
                    data: T::default(),
                });
            }
        }
        let mut file = File::open(&path).map_err(PersistError::IoError)?;
        let mut text = String::new();
        file.read_to_string(&mut text)
            .map_err(PersistError::IoError)?;
        let data = from_str::<T>(&text).map_err(PersistError::DeError)?;
        Ok(Self { path, data })
    }

    /// Save current config
    pub fn save(&self) -> Result<(), PersistError>
    where
        T: Serialize,
    {
        let text = to_string_pretty(&self.data).map_err(PersistError::SerError)?;
        let mut file = File::create(&self.path).map_err(PersistError::IoError)?;
        file.write_all(text.as_bytes())
            .map_err(PersistError::IoError)?;
        Ok(())
    }
}

/// Persist config error
#[derive(Debug)]
pub enum PersistError {
    IoError(io::Error),
    SerError(ser::Error),
    DeError(de::Error),
}

impl Error for PersistError {}

impl Display for PersistError {
    fn fmt(&self, f: &mut Formatter) -> FmtResult {
        use self::PersistError::*;
        match self {
            IoError(error) => write!(f, "IO Error: {}", error),
            SerError(error) => write!(f, "Serializing Error: {}", error),
            DeError(error) => write!(f, "Deserializing Error: {}", error),
        }
    }
}
