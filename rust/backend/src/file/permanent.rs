use super::{FileLink, PermFile, TempFile, TempFiles};
use futures::{future::join_all, Future};
use std::collections::HashSet;
use std::iter::{IntoIterator, Iterator};
use std::path::PathBuf;
use std::sync::Arc;
use tokio::fs::remove_file;
use warp::{reject::custom, Rejection};

/// Permanent files options
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FilesOptions {
    /// Base directory to store and serve files
    #[serde(default = "default_base_path")]
    pub base_path: PathBuf,
}

fn default_base_path() -> PathBuf {
    "files".into()
}

impl Default for FilesOptions {
    fn default() -> Self {
        FilesOptions {
            base_path: default_base_path(),
        }
    }
}

/// Permanent files storage
///
/// Each permanent files storage linked with one of temporary files storages.
#[derive(Clone)]
pub struct FileStorage {
    config: Arc<FilesOptions>,
    temp_files: TempFiles,
}

impl FileStorage {
    /// Create new permanent file storage
    pub fn new<T>(temp_files: T, options: FilesOptions) -> Self
    where
        T: AsRef<TempFiles>,
    {
        FileStorage {
            config: Arc::new(options),
            temp_files: temp_files.as_ref().clone(),
        }
    }

    /// Remove saved files
    pub fn clear_files<I>(
        &self,
        files: &I,
    ) -> impl Future<Item = (), Error = Rejection> + Send + 'static
    where
        for<'a> &'a I: IntoIterator<Item = &'a PermFile>,
    {
        join_all(
            files
                .into_iter()
                .map(|file| remove_file(self.file_path(&file.name)))
                .collect::<Vec<_>>(),
        ).map_err(|error| {
            error!("Unable to delete file: {}", error);
            custom(error)
        }).map(|_| {})
    }

    /// Save temporary files
    pub fn store_files<I>(
        &self,
        files: &I,
    ) -> impl Future<Item = (), Error = Rejection> + Send + 'static
    where
        for<'a> &'a I: IntoIterator<Item = &'a TempFile>,
    {
        join_all(
            files
                .into_iter()
                .map(|file| {
                    self.temp_files
                        .permanent(&file.temp, self.file_path(&file.name))
                }).collect::<Vec<_>>(),
        ).map(|_| {})
    }

    /// Update files in storage
    ///
    /// This function compares two file lists and do next things:
    ///
    /// * The permanent files from the first list which missing in the second list will be removed
    /// * The temporary files from the second list will be saved as permanent
    ///
    /// The result of operation is a new list of permanent files.
    pub fn update_files<I, J>(
        &self,
        old: J,
        new: I,
    ) -> impl Future<Item = Vec<PermFile>, Error = Rejection> + Send + 'static
    where
        for<'a> &'a J: IntoIterator<Item = &'a PermFile>,
        for<'a> &'a I: IntoIterator<Item = &'a FileLink>,
    {
        let old_set = old.into_iter().collect::<HashSet<_>>();

        let new_set = new
            .into_iter()
            .filter(|file| file.is_perm())
            .map(FileLink::as_ref)
            .collect::<HashSet<_>>();

        let to_clear = old_set
            .difference(&new_set)
            .cloned()
            .cloned()
            .collect::<Vec<_>>();

        let to_store = new
            .into_iter()
            .filter(|file| file.is_temp())
            .map(FileLink::as_ref)
            .cloned()
            .collect::<Vec<TempFile>>();

        let out = new
            .into_iter()
            .cloned()
            .map(PermFile::from)
            .collect::<Vec<_>>();

        let this = self.clone();

        self.clear_files(&to_clear)
            .and_then(move |_| this.store_files(&to_store))
            .map(move |_| out)
    }

    /// Make file path using file name
    fn file_path(&self, name: &str) -> PathBuf {
        let mut path = self.config.base_path.clone();
        path.push(&name);
        path
    }
}
