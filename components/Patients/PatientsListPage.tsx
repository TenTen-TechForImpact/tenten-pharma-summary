"use client";

import React, { useEffect, useState } from "react";
import styles from "./PatientsListPage.module.css";
import SearchBar from "@/components/SearchBar";
import ActionButton from "@/components/ActionButton";
import PatientCard from "@/components/Patients/PatientCard";
import PatientAddModal from "@/components/Patients/PatientAddModal";
import DeleteModal from "@/components/DeleteModal";

interface Patient {
  id: string;
  name: string;
  date_of_birth: Date;
  gender: string;
  phone_number: string;
  organization: string;
  created_at: Date;
  modified_at: Date;
}

const PatientsListPage = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPatients();
  }, []);

  // API를 통해 환자 목록을 가져오는 함수
  const fetchPatients = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/patients", { method: "GET" });
      if (!response.ok) throw new Error("Failed to fetch patients");

      const data: Patient[] = await response.json();
      const formattedPatients = data.map((patient) => ({
        ...patient,
        date_of_birth: new Date(patient.date_of_birth),
        created_at: new Date(patient.created_at),
        modified_at: new Date(patient.modified_at),
      }));
      setPatients(formattedPatients);
    } catch (err) {
      console.error("환자 목록을 불러오는 데 문제가 발생했습니다:", err);
    } finally {
      setLoading(false);
    }
  };

  // 환자 추가 함수
  const handleAddPatient = async (patientData: Omit<Patient, "id">) => {
    setLoading(true);
    try {
      const response = await fetch("/api/patients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...patientData,
          date_of_birth: patientData.date_of_birth.toISOString(),
          created_at: new Date().toISOString(),
          modified_at: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to create patient: ${errorText}`);
      }

      setShowModal(false);
      fetchPatients();
    } catch (err) {
      console.error("새 환자를 추가하는 데 실패했습니다:", err);
    } finally {
      setLoading(false);
    }
  };

  // 환자 삭제 함수
  const handleDeletePatient = async () => {
    if (!selectedPatient) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/patients/${selectedPatient.id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete patient");

      setPatients((prevPatients) =>
        prevPatients.filter((patient) => patient.id !== selectedPatient.id)
      );
      setShowDeleteModal(false);
      setSelectedPatient(null);
    } catch (err) {
      console.error("환자를 삭제하는 데 실패했습니다:", err);
    } finally {
      setLoading(false);
    }
  };

  // 환자 수정 함수
  const handleUpdatePatient = async (patientData: Patient) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/patients/${patientData.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...patientData,
          date_of_birth: patientData.date_of_birth.toISOString(),
          created_at: patientData.created_at.toISOString(),
          modified_at: new Date().toISOString(),
        }),
      });

      if (!response.ok) throw new Error("Failed to update patient");

      setShowModal(false);
      setSelectedPatient(null);
      fetchPatients();
    } catch (err) {
      console.error("환자 정보를 수정하는 데 실패했습니다:", err);
    } finally {
      setLoading(false);
    }
  };

  // 환자 삭제 확인 모달 열기
  const handleDeleteConfirm = (patient: Patient) => {
    setSelectedPatient(patient);
    setShowDeleteModal(true);
  };

  // 환자 정보 수정 핸들러
  const handleEditPatient = (patient: Patient) => {
    setSelectedPatient(patient);
    setShowModal(true);
  };

  // 날짜별로 그룹화하는 함수
  const groupByModifiedDate = (patients: Patient[]) => {
    return patients.reduce((acc: Record<string, Patient[]>, patient) => {
      const dateKey = patient.modified_at.toISOString().split("T")[0];
      if (!acc[dateKey]) acc[dateKey] = [];
      acc[dateKey].push(patient);
      return acc;
    }, {});
  };

  // 날짜와 요일 포맷팅
  const formatDate = (date: string) => {
    const days = ["일", "월", "화", "수", "목", "금", "토"];
    const d = new Date(date);
    return `${days[d.getDay()]} ${d.getDate()}`;
  };

  return (
    <div className={styles.patientListContainer}>
      <div className={styles.listHeader}>
        <h2 className={"text-black text-4xl font-bold"}>전체 환자 목록</h2>
        <SearchBar
          placeholder="검색어를 입력하세요"
          onSearch={(term) => setSearchTerm(term)}
        />
        <ActionButton
          text="+"
          onClick={() => setShowModal(true)}
          width={150}
          height={57}
          fontSize={64}
        />
      </div>
      {showModal && (
        <PatientAddModal
          patient={selectedPatient}
          isEditMode={!!selectedPatient}
          onClose={() => {
            setShowModal(false);
            setSelectedPatient(null);
          }}
          onSubmit={selectedPatient ? handleUpdatePatient : handleAddPatient}
        />
      )}
      {showDeleteModal && (
        <DeleteModal
          onConfirm={handleDeletePatient}
          onCancel={() => setShowDeleteModal(false)}
          deleteName={`환자 "${selectedPatient?.name}"`}
        />
      )}
      {loading ? (
        <p>환자 목록 로딩 중...</p>
      ) : (
        <div className={styles.patientList}>
          {Object.entries(groupByModifiedDate(patients)).map(
            ([date, patientGroup]) => (
              <div key={date} className={styles.groupContainer}>
                <div className={styles.groupHeader}>
                  {formatDate(date)}
                  <span className={styles.dateText}>{date}</span>
                </div>
                <div className={styles.cardList}>
                  {patientGroup
                    .sort(
                      (a, b) =>
                        b.modified_at.getTime() - a.modified_at.getTime()
                    )
                    .map((patient) => (
                      <PatientCard
                        key={patient.id}
                        patient={patient}
                        onDelete={handleDeleteConfirm}
                        onEdit={handleEditPatient}
                      />
                    ))}
                </div>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
};

export default PatientsListPage;
