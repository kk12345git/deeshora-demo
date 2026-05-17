"use client";
import { trpc } from "@/lib/trpc";
import { useParams } from "next/navigation";
import Image from "next/image";
import {
  Users,
  Loader2,
  Calendar,
  MessageSquare,
  ShieldCheck,
  ArrowLeft,
  Send,
} from "lucide-react";
import { Link } from "@/navigation";
import { motion } from "framer-motion";
import { useState } from "react";
import toast from "react-hot-toast";
export default function CommunityDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const {
    data: community,
    isLoading,
    refetch,
  } = trpc.community.getById.useQuery({ id });
  const joinMutation = trpc.community.join.useMutation({
    onSuccess: () => {
      toast.success("Joined community!");
      refetch();
    },
  });
  const leaveMutation = trpc.community.leave.useMutation({
    onSuccess: () => {
      toast.success("Left community");
      refetch();
    },
  });
  if (isLoading)
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        {" "}
        <Loader2 className="animate-spin text-brand-500 mb-4" size={40} />{" "}
        <p className="text-gray-400 font-bold uppercase tracking-widest text-sm">
          Entering Community...
        </p>{" "}
      </div>
    );
  if (!community) return <div>Not found</div>;
  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {" "}
      {/* Header */}{" "}
      <section className="bg-white border-b border-gray-100">
        {" "}
        <div className="container mx-auto px-4 py-8">
          {" "}
          <Link
            href="/communities"
            className="inline-flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-brand-500 transition-colors mb-6 uppercase tracking-widest"
          >
            {" "}
            <ArrowLeft size={16} /> Back to Hub{" "}
          </Link>{" "}
          <div className="flex flex-col md:flex-row gap-8 items-start">
            {" "}
            <div className="relative w-24 h-24 md:w-32 md:h-32 rounded-[2rem] overflow-hidden border-4 border-white shadow-2xl flex-shrink-0">
              {" "}
              <div className="w-full h-full bg-brand-500 flex items-center justify-center text-white text-3xl font-black">
                D
              </div>{" "}
            </div>{" "}
            <div className="flex-1 space-y-4">
              {" "}
              <div className="flex items-center gap-2 text-blue-500 font-black text-xs uppercase tracking-widest">
                {" "}
                <ShieldCheck size={14} /> Verified Community{" "}
              </div>{" "}
              <h1 className="text-3xl md:text-5xl font-black text-gray-900 tracking-tight">
                {community.name}
              </h1>{" "}
              <p className="text-gray-500 text-lg max-w-2xl">
                {community.description}
              </p>{" "}
              <div className="flex flex-wrap items-center gap-6 pt-2">
                {" "}
                <div className="flex items-center gap-2">
                  {" "}
                  <Users size={18} className="text-gray-400" />{" "}
                  <span className="text-sm font-bold text-gray-900">
                    {community._count.members} Members
                  </span>{" "}
                </div>{" "}
                <div className="flex items-center gap-2">
                  {" "}
                  <MessageSquare size={18} className="text-gray-400" />{" "}
                  <span className="text-sm font-bold text-gray-900">
                    12 Active Posts
                  </span>{" "}
                </div>{" "}
              </div>{" "}
            </div>{" "}
            <div className="flex-shrink-0 pt-4 md:pt-0">
              {" "}
              {community.isMember ? (
                <button
                  onClick={() => leaveMutation.mutate({ communityId: id })}
                  disabled={leaveMutation.isPending}
                  className="btn-secondary px-8 py-3.5 rounded-2xl border-2 border-brand-500/10 text-brand-600"
                >
                  {" "}
                  {leaveMutation.isPending
                    ? "Processing..."
                    : "Leave Community"}{" "}
                </button>
              ) : (
                <button
                  onClick={() => joinMutation.mutate({ communityId: id })}
                  disabled={joinMutation.isPending}
                  className="btn-primary px-10 py-3.5 rounded-2xl shadow-xl shadow-brand-500/30"
                >
                  {" "}
                  {joinMutation.isPending
                    ? "Processing..."
                    : "Join Community"}{" "}
                </button>
              )}{" "}
            </div>{" "}
          </div>{" "}
        </div>{" "}
      </section>{" "}
      {/* Content */}{" "}
      <div className="container mx-auto px-4 py-12">
        {" "}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {" "}
          {/* Feed */}{" "}
          <div className="lg:col-span-2 space-y-8">
            {" "}
            {/* Post Creator (Only if member) */}{" "}
            {community.isMember && (
              <div className="card p-6 bg-white shadow-xl shadow-gray-200/40 border-none">
                {" "}
                <div className="flex items-center gap-4 mb-4">
                  {" "}
                  <div className="w-10 h-10 rounded-full bg-gray-100 border border-gray-200" />{" "}
                  <span className="text-sm font-bold text-gray-400">
                    What&apos;s on your mind?
                  </span>{" "}
                </div>{" "}
                <div className="flex justify-end pt-4 border-t border-gray-50">
                  {" "}
                  <button className="px-6 py-2 bg-brand-50 text-brand-600 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-brand-100 transition-colors">
                    {" "}
                    Post Update{" "}
                  </button>{" "}
                </div>{" "}
              </div>
            )}{" "}
            {/* Posts */}{" "}
            {community.posts.length > 0 ? (
              community.posts.map((post: any, i: number) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="card bg-white p-8 shadow-xl shadow-gray-200/40 border-none space-y-4"
                >
                  {" "}
                  <div className="flex items-center justify-between">
                    {" "}
                    <div className="flex items-center gap-3">
                      {" "}
                      <div className="w-10 h-10 rounded-xl bg-brand-500 flex items-center justify-center text-white font-black text-sm">
                        {" "}
                        D{" "}
                      </div>{" "}
                      <div>
                        {" "}
                        <p className="text-sm font-black text-gray-900">
                          Deeshora Official
                        </p>{" "}
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                          Admin • 2 hours ago
                        </p>{" "}
                      </div>{" "}
                    </div>{" "}
                  </div>{" "}
                  <p className="text-gray-700 leading-relaxed text-lg font-medium">
                    {" "}
                    {post.content}{" "}
                  </p>{" "}
                  {post.image && (
                    <div className="relative h-64 rounded-[2rem] overflow-hidden mt-4">
                      {" "}
                      <Image
                        src={post.image}
                        alt="Post content"
                        fill
                        className="object-cover"
                      />{" "}
                    </div>
                  )}{" "}
                  <div className="flex items-center gap-6 pt-4 border-t border-gray-50">
                    {" "}
                    <button className="flex items-center gap-2 text-xs font-black text-gray-400 hover:text-brand-500 uppercase tracking-widest transition-colors">
                      {" "}
                      <MessageSquare size={14} /> 24 Comments{" "}
                    </button>{" "}
                    <button className="flex items-center gap-2 text-xs font-black text-gray-400 hover:text-brand-500 uppercase tracking-widest transition-colors">
                      {" "}
                      <Send size={14} /> Share{" "}
                    </button>{" "}
                  </div>{" "}
                </motion.div>
              ))
            ) : (
              <div className="text-center py-20 bg-white border-2 border-dashed border-gray-100 rounded-[3rem]">
                {" "}
                <p className="text-gray-400 font-bold uppercase tracking-widest text-sm">
                  No updates yet
                </p>{" "}
              </div>
            )}{" "}
          </div>{" "}
          {/* Sidebar */}{" "}
          <div className="space-y-8">
            {" "}
            <div className="card p-8 bg-gray-900 text-white border-none shadow-2xl">
              {" "}
              <h3 className="text-xl font-black mb-4 tracking-tight">
                About this Community
              </h3>{" "}
              <p className="text-gray-400 text-sm leading-relaxed mb-6">
                {" "}
                Welcome to the official Deeshora community! Join our group to stay updated with our latest product drops, cashback offers, and local events.{" "}
              </p>{" "}
            </div>{" "}
            <div className="card p-8 bg-white shadow-xl shadow-gray-200/40 border-none">
              {" "}
              <h3 className="text-lg font-black text-gray-900 mb-6 tracking-tight">
                Community Rules
              </h3>{" "}
              <ul className="space-y-4">
                {" "}
                {[
                  "Be respectful to all members",
                  "No spam or irrelevant promotion",
                  "Keep conversations local",
                  "Enjoy the exclusive perks!",
                ].map((rule, i) => (
                  <li
                    key={i}
                    className="flex gap-3 text-sm text-gray-500 font-medium"
                  >
                    {" "}
                    <div className="w-1.5 h-1.5 rounded-full bg-brand-500 mt-1.5 flex-shrink-0" />{" "}
                    {rule}{" "}
                  </li>
                ))}{" "}
              </ul>{" "}
            </div>{" "}
          </div>{" "}
        </div>{" "}
      </div>{" "}
    </div>
  );
}
