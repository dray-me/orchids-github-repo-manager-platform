"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Upload,
  FolderArchive,
  GitBranch,
  File,
  Folder,
  Plus,
  ExternalLink,
  Loader2,
  Check,
  RefreshCw,
  FileCode,
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { useDropzone } from "react-dropzone";

interface ExtractedFile {
  path: string;
  size: number;
  isDirectory: boolean;
  content?: string;
}

interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  html_url: string;
  private: boolean;
  default_branch: string;
}

interface Upload {
  id: string;
  original_filename: string;
  file_type: string;
  file_size: number;
  extracted_files: ExtractedFile[];
  status: string;
  created_at: string;
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [files, setFiles] = useState<ExtractedFile[]>([]);
  const [uploadId, setUploadId] = useState<string | null>(null);
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isPushing, setIsPushing] = useState(false);
  const [isCreatingRepo, setIsCreatingRepo] = useState(false);
  const [showCreateRepo, setShowCreateRepo] = useState(false);
  const [selectedRepo, setSelectedRepo] = useState<string>("");
  const [commitMessage, setCommitMessage] = useState("");
  const [newRepoName, setNewRepoName] = useState("");
  const [newRepoDesc, setNewRepoDesc] = useState("");
  const [newRepoPrivate, setNewRepoPrivate] = useState(false);
  const [selectedFile, setSelectedFile] = useState<ExtractedFile | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  const fetchRepos = useCallback(async () => {
    try {
      const res = await fetch("/api/repos");
      const data = await res.json();
      if (data.repositories) {
        setRepos(data.repositories);
      }
    } catch (error) {
      console.error("Failed to fetch repos:", error);
    }
  }, []);

  const fetchUploads = useCallback(async () => {
    try {
      const res = await fetch("/api/upload");
      const data = await res.json();
      if (data.uploads) {
        setUploads(data.uploads);
      }
    } catch (error) {
      console.error("Failed to fetch uploads:", error);
    }
  }, []);

  useEffect(() => {
    if (session) {
      fetchRepos();
      fetchUploads();
    }
  }, [session, fetchRepos, fetchUploads]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Upload failed");
      }

      setFiles(data.files);
      setUploadId(data.uploadId);
      toast.success(`Extracted ${data.totalFiles} files from ${file.name}`);
      fetchUploads();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setIsUploading(false);
    }
  }, [fetchUploads]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/zip": [".zip"],
      "application/gzip": [".gz", ".tgz"],
      "application/x-tar": [".tar"],
    },
    maxFiles: 1,
    disabled: isUploading,
  });

  const handleCreateRepo = async () => {
    if (!newRepoName.trim()) {
      toast.error("Repository name is required");
      return;
    }

    setIsCreatingRepo(true);
    try {
      const res = await fetch("/api/repos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newRepoName,
          description: newRepoDesc,
          isPrivate: newRepoPrivate,
          uploadId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create repository");
      }

      toast.success(`Created repository: ${data.githubRepo.full_name}`);
      setSelectedRepo(data.githubRepo.full_name);
      setShowCreateRepo(false);
      setNewRepoName("");
      setNewRepoDesc("");
      setNewRepoPrivate(false);
      fetchRepos();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create repository");
    } finally {
      setIsCreatingRepo(false);
    }
  };

  const handlePush = async () => {
    if (!selectedRepo || !uploadId) {
      toast.error("Select a repository and upload files first");
      return;
    }

    setIsPushing(true);
    try {
      const res = await fetch("/api/repos/push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          repoFullName: selectedRepo,
          uploadId,
          commitMessage: commitMessage || "Initial commit via RepoForge",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to push files");
      }

      toast.success(`Pushed ${data.filesCount} files to ${selectedRepo}`);
      fetchUploads();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to push files");
    } finally {
      setIsPushing(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const loadUpload = (upload: Upload) => {
    setFiles(upload.extracted_files);
    setUploadId(upload.id);
    toast.info(`Loaded ${upload.original_filename}`);
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const directories = files.filter((f) => f.isDirectory);
  const filesList = files.filter((f) => !f.isDirectory);

  return (
    <div className="min-h-screen p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {session.user?.name || session.user?.githubUsername}
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div
              {...getRootProps()}
              className={`glass-panel rounded-2xl p-8 border-2 border-dashed transition-all cursor-pointer ${
                isDragActive
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50"
              } ${isUploading ? "opacity-50 cursor-wait" : ""}`}
            >
              <input {...getInputProps()} />
              <div className="text-center">
                {isUploading ? (
                  <Loader2 className="w-12 h-12 mx-auto mb-4 text-primary animate-spin" />
                ) : (
                  <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                )}
                <h3 className="text-lg font-semibold mb-2">
                  {isUploading
                    ? "Processing archive..."
                    : isDragActive
                    ? "Drop your archive here"
                    : "Upload Archive"}
                </h3>
                <p className="text-muted-foreground text-sm">
                  Drag & drop a .zip, .tar, or .tar.gz file, or click to browse
                </p>
              </div>
            </div>

            <AnimatePresence mode="wait">
              {files.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="glass-panel rounded-2xl overflow-hidden"
                >
                  <div className="p-4 border-b border-border flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FolderArchive className="w-5 h-5 text-primary" />
                      <span className="font-medium">
                        Extracted Files ({filesList.length} files, {directories.length} directories)
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setFiles([]);
                        setUploadId(null);
                        setSelectedFile(null);
                      }}
                    >
                      Clear
                    </Button>
                  </div>
                  <ScrollArea className="h-80">
                    <div className="p-4 space-y-1">
                      {files.map((file, i) => (
                        <div
                          key={i}
                          onClick={() => !file.isDirectory && file.content && setSelectedFile(file)}
                          className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                            file.isDirectory
                              ? "text-muted-foreground"
                              : "hover:bg-accent cursor-pointer"
                          } ${selectedFile?.path === file.path ? "bg-accent" : ""}`}
                        >
                          {file.isDirectory ? (
                            <Folder className="w-4 h-4 text-[#ffd93d]" />
                          ) : (
                            <File className="w-4 h-4 text-primary" />
                          )}
                          <span className="flex-1 truncate text-sm font-mono">
                            {file.path}
                          </span>
                          {!file.isDirectory && (
                            <span className="text-xs text-muted-foreground">
                              {formatFileSize(file.size)}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </motion.div>
              )}
            </AnimatePresence>

            {selectedFile && selectedFile.content && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-panel rounded-2xl overflow-hidden"
              >
                <div className="p-4 border-b border-border flex items-center gap-3">
                  <FileCode className="w-5 h-5 text-primary" />
                  <span className="font-medium font-mono text-sm truncate">
                    {selectedFile.path}
                  </span>
                </div>
                <ScrollArea className="h-64">
                  <pre className="p-4 text-sm font-mono text-muted-foreground overflow-x-auto">
                    {selectedFile.content}
                  </pre>
                </ScrollArea>
              </motion.div>
            )}
          </div>

          <div className="space-y-6">
            <div className="glass-panel rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <GitBranch className="w-5 h-5 text-primary" />
                  Push to Repository
                </h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={fetchRepos}
                  className="h-8 w-8"
                >
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Select Repository</Label>
                  <Select value={selectedRepo} onValueChange={setSelectedRepo}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a repository" />
                    </SelectTrigger>
                    <SelectContent>
                      {repos.map((repo) => (
                        <SelectItem key={repo.id} value={repo.full_name}>
                          <div className="flex items-center gap-2">
                            <span>{repo.full_name}</span>
                            {repo.private && (
                              <span className="text-xs px-1.5 py-0.5 rounded bg-muted">
                                private
                              </span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setShowCreateRepo(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create New Repository
                </Button>

                <div className="space-y-2">
                  <Label>Commit Message</Label>
                  <Input
                    placeholder="Initial commit"
                    value={commitMessage}
                    onChange={(e) => setCommitMessage(e.target.value)}
                  />
                </div>

                <Button
                  className="w-full bg-gradient-to-r from-[#00d4aa] to-[#00a8ff] hover:opacity-90 text-background"
                  disabled={!uploadId || !selectedRepo || isPushing}
                  onClick={handlePush}
                >
                  {isPushing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Pushing...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Push to GitHub
                    </>
                  )}
                </Button>

                {selectedRepo && (
                  <a
                    href={`https://github.com/${selectedRepo}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    View on GitHub
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>

            {uploads.length > 0 && (
              <div className="glass-panel rounded-2xl p-6">
                <h3 className="font-semibold mb-4">Recent Uploads</h3>
                <div className="space-y-2">
                  {uploads.slice(0, 5).map((upload) => (
                    <div
                      key={upload.id}
                      onClick={() => loadUpload(upload)}
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-accent cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <FolderArchive className="w-4 h-4 text-primary shrink-0" />
                        <span className="text-sm truncate">
                          {upload.original_filename}
                        </span>
                      </div>
                      <span
                        className={`text-xs px-2 py-0.5 rounded ${
                          upload.status === "pushed"
                            ? "bg-green-500/20 text-green-400"
                            : "bg-primary/20 text-primary"
                        }`}
                      >
                        {upload.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <Dialog open={showCreateRepo} onOpenChange={setShowCreateRepo}>
        <DialogContent className="glass-panel border-border">
          <DialogHeader>
            <DialogTitle>Create New Repository</DialogTitle>
            <DialogDescription>
              Create a new GitHub repository to push your files to
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Repository Name</Label>
              <Input
                placeholder="my-awesome-project"
                value={newRepoName}
                onChange={(e) => setNewRepoName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Description (optional)</Label>
              <Textarea
                placeholder="A brief description of your project"
                value={newRepoDesc}
                onChange={(e) => setNewRepoDesc(e.target.value)}
                rows={3}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Private Repository</Label>
                <p className="text-xs text-muted-foreground">
                  Only you can see this repository
                </p>
              </div>
              <Switch
                checked={newRepoPrivate}
                onCheckedChange={setNewRepoPrivate}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateRepo(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateRepo}
              disabled={isCreatingRepo || !newRepoName.trim()}
              className="bg-gradient-to-r from-[#00d4aa] to-[#00a8ff] hover:opacity-90 text-background"
            >
              {isCreatingRepo ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Repository"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
