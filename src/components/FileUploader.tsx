"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, FileCheck, X, CloudUpload } from "lucide-react";
import { motion } from "framer-motion";

interface FileUploaderProps {
  onFileSelected: (file: File | null) => void;
  accept?: Record<string, string[]>;
  variant?: "default" | "glass";
}

export function FileUploader({
  onFileSelected,
  accept = {
    "application/pdf": [".pdf"],
  },
  variant = "default",
}: FileUploaderProps) {
  const [fileName, setFileName] = useState<string | null>(null);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      setFileName(file.name);
      onFileSelected(file);
    },
    [onFileSelected]
  );

  const removeFile = () => {
    setFileName(null);
    onFileSelected(null);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    maxFiles: 1,
    multiple: false,
  });

  if (fileName) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="card p-6"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
              <FileCheck size={18} className="text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-semibold">{fileName}</p>
              <p className="text-xs text-muted">Fichier pret</p>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={removeFile}
            className="p-2 rounded-lg hover:bg-red-50 text-muted hover:text-error transition-colors"
          >
            <X size={16} />
          </motion.button>
        </div>
      </motion.div>
    );
  }

  return (
    <div
      {...getRootProps()}
      className={`group relative border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all duration-300 ${
        variant === "glass"
          ? isDragActive
            ? "border-white/50 bg-white/10 scale-[1.02]"
            : "border-white/25 hover:border-white/40 hover:bg-white/5"
          : isDragActive
            ? "border-accent bg-accent-light/30 scale-[1.02]"
            : "border-border hover:border-accent/50 hover:bg-accent-light/10"
      }`}
    >
      <input {...getInputProps()} />
      
      <motion.div
        animate={isDragActive ? { y: -5, scale: 1.1 } : { y: 0, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className={`w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center transition-colors duration-300 ${
          variant === "glass"
            ? isDragActive ? "bg-white/20" : "bg-white/10"
            : isDragActive ? "bg-accent/10" : "bg-accent-light"
        }`}>
          <CloudUpload
            size={28}
            className={`transition-colors duration-300 ${
              variant === "glass"
                ? "text-white/70"
                : isDragActive ? "text-accent" : "text-muted"
            }`}
            strokeWidth={1.5}
          />
        </div>
      </motion.div>

      <p className={`text-sm font-semibold ${variant === "glass" ? "text-white" : ""}`}>
        {isDragActive ? "Deposez votre fichier ici" : "Glissez-deposez votre fichier"}
      </p>
      <p className={`text-xs mt-1.5 ${variant === "glass" ? "text-white/50" : "text-muted"}`}>
        ou <span className={`font-medium ${variant === "glass" ? "text-white/70" : "text-accent"}`}>parcourir</span> — PDF uniquement, max 50 Mo
      </p>
    </div>
  );
}
